import { useState, useEffect } from 'react';

let _listeners = [];
let _toasts = [];
let _id = 0;

export function toast(message, type = 'success', duration = 3000) {
  const id = ++_id;
  _toasts = [..._toasts, { id, message, type }];
  _listeners.forEach(fn => fn(_toasts));
  setTimeout(() => {
    _toasts = _toasts.filter(t => t.id !== id);
    _listeners.forEach(fn => fn(_toasts));
  }, duration);
}

export function useToastState() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    _listeners.push(setToasts);
    return () => { _listeners = _listeners.filter(fn => fn !== setToasts); };
  }, []);
  return toasts;
}
