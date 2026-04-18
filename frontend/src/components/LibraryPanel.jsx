import { useEffect, useState } from "react";
import api from "../services/api";
import { campusZones } from "../data/mockData";

function LibraryPanel() {
  const [books, setBooks] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.get("/books").then((res) => setBooks(res.data));
  }, []);

  const requestBook = async (title) => {
    const location = campusZones[1];
    const response = await api.post("/books/request", {
      title,
      location: { lat: location.lat, lng: location.lng, address: location.label },
      slot: "Today 5 PM"
    });
    setMessage(response.data.message);
  };

  const requestReturn = async (title) => {
    const response = await api.post("/books/return-pickup", { title, slot: "Tomorrow 10 AM" });
    setMessage(response.data.message);
  };

  return (
    <section className="rounded-3xl border border-lime-200 bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg text-slate-900">Library Doorstep Delivery</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {books.map((book) => (
          <article key={book.id} className="rounded-2xl border border-lime-200 bg-lime-50 p-4">
            <h4 className="font-semibold text-slate-900">{book.title}</h4>
            <p className="mt-1 text-sm text-slate-600">{book.author}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => requestBook(book.title)} className="rounded-full bg-lime-500 px-3 py-1 text-xs font-medium text-white hover:bg-lime-600">Deliver</button>
              <button onClick={() => requestReturn(book.title)} className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-lime-100">Return Pickup</button>
            </div>
          </article>
        ))}
      </div>
      {message && <p className="mt-3 text-sm text-lime-700">{message}</p>}
    </section>
  );
}

export default LibraryPanel;
