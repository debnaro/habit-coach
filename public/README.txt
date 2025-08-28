Habit Coach PWA Assets
========================

Files included:
- manifest.json
- sw.js
- icons/icon-192.png
- icons/icon-512.png
- HEAD_SNIPPET.html (copy this into <head> of public/index.html)

How to use (Vite/React):
1) Copy the 'manifest.json' and 'sw.js' into your project's 'public/' folder.
2) Copy the 'icons' folder into 'public/icons/' (create folders if they don't exist).
3) Open 'public/index.html' and paste the contents of HEAD_SNIPPET.html inside the <head>.
4) Ensure your app registers the service worker somewhere in your code (e.g. index.tsx):
   if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
5) Run the dev server and open the site in Chrome on Android. Use 'Add to Home screen'.
