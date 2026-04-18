import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

const categories = ["All", "Electronics", "Books", "Furniture", "Sports", "Other"];
const conditions = ["Like New", "Good", "Used"];

function RentPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("marketplace");
  const [selectedItem, setSelectedItem] = useState(null);
  const [chatRequest, setChatRequest] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatOffer, setChatOffer] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);

  const [detailDuration, setDetailDuration] = useState(3);
  const [detailContact, setDetailContact] = useState("Campus contact");

  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Other",
    condition: "Good",
    location: "Campus",
    pricePerDay: 100,
    imageDataUrl: "",
    availability: true
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [itemsRes, reqRes] = await Promise.all([
        api.get("/rent/items", { params: { showUnavailable: true } }),
        api.get("/rent/requests")
      ]);
      setItems(itemsRes.data);
      setRequests(reqRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load rent marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const myListings = useMemo(() => items.filter((item) => item.ownerId?._id === user?.id), [items, user?.id]);

  const marketplaceItems = useMemo(() => {
    const filtered = items
      .filter((item) => item.ownerId?._id !== user?.id)
      .filter((item) => item.availability)
      .filter((item) => {
        const text = `${item.name} ${item.description} ${item.category} ${item.location}`.toLowerCase();
        const q = query.trim().toLowerCase();
        const queryMatch = !q || text.includes(q);
        const categoryMatch = categoryFilter === "All" || item.category === categoryFilter;
        return queryMatch && categoryMatch;
      });

    if (sortBy === "price-low") {
      return [...filtered].sort((a, b) => a.pricePerDay - b.pricePerDay);
    }
    if (sortBy === "price-high") {
      return [...filtered].sort((a, b) => b.pricePerDay - a.pricePerDay);
    }
    return [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, user?.id, query, categoryFilter, sortBy]);

  const incomingRequests = useMemo(() => requests.filter((request) => request.lenderId?._id === user?.id), [requests, user?.id]);
  const outgoingRequests = useMemo(() => requests.filter((request) => request.renterId?._id === user?.id), [requests, user?.id]);

  const compressImageFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const maxSize = 1024;
          const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("Cannot prepare image"));
            return;
          }

          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        };
        image.onerror = () => reject(new Error("Invalid image file"));
        image.src = String(reader.result || "");
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const onImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const compressed = await compressImageFile(file);
      setForm((prev) => ({ ...prev, imageDataUrl: compressed }));
      setMessage(t("imageCompressed"));
      setError("");
    } catch (uploadError) {
      setError(uploadError.message || "Unable to process selected image");
    }
  };

  const addRentItem = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      await api.post("/rent/items", {
        name: form.name,
        description: form.description,
        category: form.category,
        condition: form.condition,
        location: form.location,
        pricePerDay: Number(form.pricePerDay),
        images: form.imageDataUrl ? [form.imageDataUrl] : [],
        availability: form.availability
      });
      setForm({
        name: "",
        description: "",
        category: "Other",
        condition: "Good",
        location: "Campus",
        pricePerDay: 100,
        imageDataUrl: "",
        availability: true
      });
      setMessage("Item listed successfully");
      setActiveTab("lend");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to list item");
    }
  };

  const requestRental = async (item, durationDays = detailDuration, contact = detailContact) => {
    setMessage("");
    setError("");
    try {
      await api.post("/rent/request", {
        rentItemId: item._id,
        durationDays: Math.max(1, Number(durationDays || 1)),
        contact
      });
      setMessage("Rental request sent");
      setSelectedItem(null);
      setActiveTab("requests");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to request rental");
    }
  };

  const approve = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/rent/requests/${id}/approve`);
      setMessage("Rental request approved");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to approve request");
    }
  };

  const reject = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/rent/requests/${id}/reject`);
      setMessage("Rental request rejected");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to reject request");
    }
  };

  const cancelRequest = async (id) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/rent/requests/${id}/cancel`);
      setMessage("Rental request cancelled");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to cancel request");
    }
  };

  const openChat = async (request) => {
    setError("");
    setMessage("");
    try {
      const response = await api.get(`/rent/requests/${request._id}/messages`);
      setChatRequest({
        ...request,
        messages: response.data.messages || [],
        negotiatedPricePerDay: response.data.negotiatedPricePerDay,
        totalCost: response.data.totalCost
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to open negotiation chat");
    }
  };

  const sendChatMessage = async () => {
    if (!chatRequest) {
      return;
    }

    setError("");
    setMessage("");
    try {
      const response = await api.post(`/rent/requests/${chatRequest._id}/messages`, {
        text: chatText,
        offeredPricePerDay: Number(chatOffer || 0)
      });

      setChatRequest((prev) => prev
        ? {
          ...prev,
          messages: response.data.messages || [],
          negotiatedPricePerDay: response.data.negotiatedPricePerDay,
          totalCost: response.data.totalCost
        }
        : prev);

      setChatText("");
      setChatOffer(0);
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send message");
    }
  };

  const toggleAvailability = async (item) => {
    setMessage("");
    setError("");
    try {
      await api.patch(`/rent/items/${item._id}`, {
        availability: !item.availability
      });
      setMessage("Listing status updated");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to update listing");
    }
  };

  const deleteItem = async (item) => {
    setMessage("");
    setError("");
    try {
      await api.delete(`/rent/items/${item._id}`);
      setMessage("Listing removed");
      load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to remove listing");
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h1 className="font-display text-2xl font-semibold">{t("rent")}</h1>
        <p className="text-sm text-slate-600">{t("rentSubtitle")}</p>
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-lime-200 bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setActiveTab("marketplace")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${activeTab === "marketplace" ? "bg-lime-600 text-white" : "text-slate-600"}`}>{t("marketplace")}</button>
        <button type="button" onClick={() => setActiveTab("lend")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${activeTab === "lend" ? "bg-lime-600 text-white" : "text-slate-600"}`}>{t("lendEarn")}</button>
        <button type="button" onClick={() => setActiveTab("requests")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${activeTab === "requests" ? "bg-lime-600 text-white" : "text-slate-600"}`}>{t("myRequests")}</button>
      </div>

      {message && <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

      {loading && <p className="rounded-xl bg-white p-3 text-sm text-slate-600">{t("loadingMarketplace")}</p>}

      {!loading && activeTab === "marketplace" && (
        <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
          <h3 className="font-semibold">{t("browseRentableItems")}</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
            />
            <select className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Newest</option>
              <option value="price-low">Price low to high</option>
              <option value="price-high">Price high to low</option>
            </select>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {!marketplaceItems.length && <p className="text-sm text-slate-600">{t("noMarketplaceItems")}</p>}
            {marketplaceItems.map((item) => (
              <article key={item._id} className="rounded-xl border border-lime-200 bg-lime-50 p-3">
                {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="mb-2 h-36 w-full rounded-lg object-cover" />}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-slate-600">{item.condition || "Good"}</span>
                </div>
                <p className="text-xs text-slate-600">INR {item.pricePerDay}/day</p>
                <p className="text-xs text-slate-600">{item.category || "Other"} • {item.location || "Campus"}</p>
                <p className="text-xs text-slate-600">Owner: {item.ownerId?.name || t("campusUser")}</p>
                <p className="line-clamp-2 text-xs text-slate-600">{item.description}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setSelectedItem(item)} className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-semibold text-lime-700">{t("viewDetails")}</button>
                  <button type="button" onClick={() => requestRental(item, 3, "Campus contact")}
                    className="rounded-full bg-lime-600 px-3 py-1 text-xs font-semibold text-white">{t("requestRental")}</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {!loading && activeTab === "lend" && (
        <>
          <form onSubmit={addRentItem} className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm grid gap-3 md:grid-cols-2">
            <input required placeholder={t("itemName")} className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            <input type="number" min="1" placeholder={t("pricePerDay")} className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.pricePerDay} onChange={(event) => setForm((prev) => ({ ...prev, pricePerDay: Number(event.target.value) }))} />

            <select className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
              {categories.filter((value) => value !== "All").map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
            <select className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.condition} onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value }))}>
              {conditions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>

            <input className="md:col-span-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.location} onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" />

            <label className="md:col-span-2 block text-sm text-slate-700">
              {t("uploadImageLocal")}
              <input type="file" accept="image/*" className="mt-1 block w-full rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm" onChange={onImageUpload} />
            </label>
            {form.imageDataUrl && <img src={form.imageDataUrl} alt="Preview" className="md:col-span-2 h-40 w-full rounded-xl object-cover" />}

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.availability} onChange={(event) => setForm((prev) => ({ ...prev, availability: event.target.checked }))} />
              {t("availableForRent")}
            </label>

            <textarea placeholder="Description" className="md:col-span-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
            <button type="submit" className="md:col-span-2 rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">{t("uploadRentItem")}</button>
          </form>

          <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{t("myListedItems")}</h3>
            <div className="mt-3 space-y-2">
              {!myListings.length && <p className="text-sm text-slate-600">{t("noListings")}</p>}
              {myListings.map((item) => (
                <article key={item._id} className="rounded-xl bg-lime-50 p-3">
                  {item.images?.[0] && <img src={item.images[0]} alt={item.name} className="mb-2 h-32 w-full rounded-lg object-cover" />}
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-600">INR {item.pricePerDay}/day • {item.category}</p>
                  <p className="text-xs text-slate-600">{item.location}</p>
                  <p className="text-xs text-slate-600">{t("status")}: {item.availability ? "Available" : "Unavailable"}</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => toggleAvailability(item)} className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-semibold text-lime-700">{item.availability ? "Mark Unavailable" : "Mark Available"}</button>
                    <button type="button" onClick={() => deleteItem(item)} className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && activeTab === "requests" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{t("requestsForMyItems")}</h3>
            <div className="mt-3 space-y-2">
              {!incomingRequests.length && <p className="text-sm text-slate-600">{t("noIncomingRequests")}</p>}
              {incomingRequests.map((request) => (
                <article key={request._id} className="rounded-xl bg-lime-50 p-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">{request.rentItemId?.name}</p>
                  <p>{t("renter")}: {request.renterId?.name || "-"}</p>
                  <p>{t("durationDays")}: {request.durationDays}</p>
                  <p>{t("total")}: INR {request.totalCost}</p>
                  <p>{t("contact")}: {request.contact || "-"}</p>
                  <p>{t("status")}: {request.status}</p>
                  {request.status === "Requested" && (
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => approve(request._id)} className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">{t("approve")}</button>
                      <button type="button" onClick={() => reject(request._id)} className="rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white">{t("reject")}</button>
                    </div>
                  )}
                  <button type="button" onClick={() => openChat(request)} className="mt-2 rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-semibold text-lime-700">{t("openChat")}</button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-lime-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{t("myRentedRequests")}</h3>
            <div className="mt-3 space-y-2">
              {!outgoingRequests.length && <p className="text-sm text-slate-600">{t("noOutgoingRequests")}</p>}
              {outgoingRequests.map((request) => (
                <article key={request._id} className="rounded-xl bg-lime-50 p-3 text-xs text-slate-700">
                  <p className="font-semibold text-slate-900">{request.rentItemId?.name}</p>
                  <p>{t("lender")}: {request.lenderId?.name || "-"}</p>
                  <p>{t("durationDays")}: {request.durationDays}</p>
                  <p>{t("total")}: INR {request.totalCost}</p>
                  <p>{t("status")}: {request.status}</p>
                  {request.status === "Requested" && (
                    <button type="button" onClick={() => cancelRequest(request._id)} className="mt-2 rounded-full border border-rose-300 bg-white px-3 py-1 text-xs font-semibold text-rose-700">Cancel</button>
                  )}
                  <button type="button" onClick={() => openChat(request)} className="mt-2 ml-2 rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-semibold text-lime-700">{t("openChat")}</button>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}

      {chatRequest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/55 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">{t("negotiationChat")}</h3>
            <p className="text-sm text-slate-600">{chatRequest.rentItemId?.name}</p>
            <p className="text-sm text-slate-600">{t("offerPerDay")}: INR {chatRequest.negotiatedPricePerDay || chatRequest.rentItemId?.pricePerDay || 0}</p>
            <p className="text-sm text-slate-600">{t("total")}: INR {chatRequest.totalCost || 0}</p>

            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl bg-lime-50 p-3">
              {!chatRequest.messages?.length && <p className="text-sm text-slate-600">{t("noMessagesYet")}</p>}
              {chatRequest.messages?.map((entry, index) => {
                const mine = entry.senderId?._id === user?.id || entry.senderId === user?.id;
                return (
                  <div key={`${entry._id || index}`} className={`rounded-xl p-2 text-xs ${mine ? "ml-8 bg-lime-200 text-slate-800" : "mr-8 bg-white text-slate-700"}`}>
                    <p className="font-semibold">{entry.senderId?.name || entry.senderRole}</p>
                    {entry.text && <p>{entry.text}</p>}
                    {entry.offeredPricePerDay > 0 && <p>Offer: INR {entry.offeredPricePerDay}/day</p>}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-3">
              <input
                className="md:col-span-2 rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
                value={chatText}
                onChange={(event) => setChatText(event.target.value)}
                placeholder={t("typeMessage")}
              />
              <input
                type="number"
                min="0"
                className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
                value={chatOffer}
                onChange={(event) => setChatOffer(event.target.value)}
                placeholder={t("offerPerDay")}
              />
            </div>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={sendChatMessage} className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">{t("send")}</button>
              <button type="button" onClick={() => setChatRequest(null)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{t("close")}</button>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/55 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-4 shadow-xl">
            {selectedItem.images?.[0] && (
              <img src={selectedItem.images[0]} alt={selectedItem.name} className="h-56 w-full rounded-xl object-cover" />
            )}
            <h3 className="mt-3 text-lg font-semibold text-slate-900">{selectedItem.name}</h3>
            <p className="mt-1 text-sm text-slate-600">INR {selectedItem.pricePerDay} / day</p>
            <p className="mt-1 text-sm text-slate-600">{selectedItem.category || "Other"} • {selectedItem.condition || "Good"}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedItem.location || "Campus"}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedItem.description || t("noDescription")}</p>

            <div className="mt-3 rounded-xl bg-lime-50 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{t("ownerDetails")}</p>
              <p>{t("name")}: {selectedItem.ownerId?.name || t("campusUser")}</p>
              <p>{t("contact")}: {selectedItem.ownerId?.email || "Not provided"}</p>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <input
                type="number"
                min="1"
                className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
                value={detailDuration}
                onChange={(event) => setDetailDuration(event.target.value)}
                placeholder={t("durationDays")}
              />
              <input
                className="rounded-xl border border-lime-200 bg-lime-50 px-3 py-2 text-sm"
                value={detailContact}
                onChange={(event) => setDetailContact(event.target.value)}
                placeholder={t("contactDetails")}
              />
            </div>

            <p className="mt-2 text-sm text-slate-700">{t("total")}: INR {Math.max(1, Number(detailDuration || 1)) * Number(selectedItem.pricePerDay || 0)}</p>

            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => requestRental(selectedItem)} className="rounded-full bg-lime-600 px-4 py-2 text-sm font-semibold text-white">{t("requestThisItem")}</button>
              <button type="button" onClick={() => setSelectedItem(null)} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">{t("close")}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default RentPage;
