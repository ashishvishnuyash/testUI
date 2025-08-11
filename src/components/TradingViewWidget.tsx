import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget() {
  const container = useRef<HTMLDivElement>(null);
  const scriptAdded = useRef(false);
  const widgetId = useRef(`tradingview_${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!container.current || scriptAdded.current) return;

    const currentContainer = container.current;
    
    // Clear any existing content first
    currentContainer.innerHTML = '';

    // Create the widget container structure with unique ID
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'tradingview-widget-container__widget';
    widgetContainer.id = widgetId.current;
    widgetContainer.style.height = 'calc(100% - 32px)';
    widgetContainer.style.width = '100%';

    const copyrightDiv = document.createElement('div');
    copyrightDiv.className = 'tradingview-widget-copyright';
    copyrightDiv.innerHTML = `
      <a href="https://www.tradingview.com/symbols/NASDAQ-AAPL/?exchange=NASDAQ" rel="noopener nofollow" target="_blank">
        <span class="blue-text">AAPL chart by TradingView</span>
      </a>
    `;

    // Add the structure to container
    currentContainer.appendChild(widgetContainer);
    currentContainer.appendChild(copyrightDiv);

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!currentContainer.parentNode) return; // Check if still mounted

      // Create and add the script
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      
      // Add error handling for the script
      script.onerror = () => {
        console.warn('TradingView widget failed to load');
      };
      
      script.innerHTML = JSON.stringify({
        "container_id": widgetId.current,
        "allow_symbol_change": true,
        "calendar": false,
        "details": false,
        "hide_side_toolbar": true,
        "hide_top_toolbar": false,
        "hide_legend": false,
        "hide_volume": false,
        "hotlist": false,
        "interval": "D",
        "locale": "en",
        "save_image": true,
        "style": "1",
        "symbol": "NASDAQ:AAPL",
        "theme": "dark",
        "timezone": "Etc/UTC",
        "backgroundColor": "#0F0F0F",
        "gridColor": "rgba(242, 242, 242, 0.06)",
        "watchlist": [],
        "withdateranges": false,
        "compareSymbols": [],
        "studies": [],
        "autosize": true
      });

      currentContainer.appendChild(script);
      scriptAdded.current = true;
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      scriptAdded.current = false;
      
      // More gentle cleanup - don't immediately clear innerHTML
      // Let TradingView clean up its own resources first
      setTimeout(() => {
        if (currentContainer && currentContainer.parentNode) {
          // Remove any iframes that might still be loading
          const iframes = currentContainer.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            try {
              iframe.remove();
            } catch (e) {
              // Ignore errors during cleanup
            }
          });
          currentContainer.innerHTML = '';
        }
      }, 50);
    };
  }, []);

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: "100%", width: "100%" }}
    />
  );
}

export default memo(TradingViewWidget);