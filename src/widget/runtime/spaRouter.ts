export function onRouteChange(listener: () => void): void {
  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args): void => {
    originalPushState(...args);
    listener();
  };

  window.history.replaceState = (...args): void => {
    originalReplaceState(...args);
    listener();
  };

  window.addEventListener('popstate', listener);
}

