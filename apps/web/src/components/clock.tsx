import { useEffect, useState } from "react";
import { formatTime } from "../lib/format-time";

const Clock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <span
      aria-label="Current local time"
      className="font-mono text-2xl text-slate-100 tabular-nums"
    >
      {formatTime(now)}
    </span>
  );
};

export default Clock;
