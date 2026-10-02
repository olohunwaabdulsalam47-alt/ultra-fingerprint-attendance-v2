import { useEffect, useState } from "react";

export default function ConnectionStatus() {
  const [online, setOnline] = useState(
    () => navigator.onLine,
  );

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
    }

    function handleOffline() {
      setOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener(
        "online",
        handleOnline,
      );

      window.removeEventListener(
        "offline",
        handleOffline,
      );
    };
  }, []);

  return (
    <p role="status">
      Connection:{" "}
      <strong>
        {online
          ? "Online"
          : "Offline — Local Data Mode"}
      </strong>
    </p>
  );
}
