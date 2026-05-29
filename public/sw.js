// CricketApp push notification service worker

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "CricketApp", body: event.data.text() };
  }

  const title = data.title ?? "CricketApp";
  const options = {
    body: data.body ?? "",
    icon: data.icon ?? "/icon-192.png",
    badge: "/icon-96.png",
    tag: data.url ?? "cricketapp",   // collapses duplicate notifications for same match
    renotify: true,
    data: { url: data.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes(url) && "focus" in win) {
          return win.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
