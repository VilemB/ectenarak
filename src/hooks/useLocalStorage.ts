import { useState, useEffect } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize on mount only
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save state
      setStoredValue(valueToStore);

      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));

      // Dispatch a custom event to notify other components using the same key
      window.dispatchEvent(
        new CustomEvent("local-storage-update", {
          detail: { key, value: valueToStore },
        })
      );
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes to localStorage from other components
  useEffect(() => {
    const handleStorageUpdate = (e: CustomEvent<{ key: string; value: T }>) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener(
      "local-storage-update",
      handleStorageUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "local-storage-update",
        handleStorageUpdate as EventListener
      );
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
