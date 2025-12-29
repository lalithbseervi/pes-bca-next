'use client';
import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "app_device_id";

function generateUUID() {
  return crypto.randomUUID();
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    let existing = localStorage.getItem(DEVICE_ID_KEY);

    if (!existing) {
      existing = generateUUID();
      localStorage.setItem(DEVICE_ID_KEY, existing);
    }

    setDeviceId(existing);
  }, []);

  return deviceId;
}