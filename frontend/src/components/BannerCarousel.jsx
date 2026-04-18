import { useEffect, useState } from "react";

const banners = [
  "Flash Deals up to 30% off on campus favorites",
  "Zero delivery fee above INR 399",
  "Recycle today and unlock eco rewards instantly"
];

function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % banners.length);
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-500 p-4 text-white shadow-md">
      <p className="text-sm font-semibold">{banners[index]}</p>
      <div className="mt-2 flex gap-2">
        {banners.map((_, dot) => (
          <span
            key={dot}
            className={`h-1.5 w-6 rounded-full ${dot === index ? "bg-white" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default BannerCarousel;
