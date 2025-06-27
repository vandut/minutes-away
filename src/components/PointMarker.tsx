import React, { useState, useRef, useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Point, Category } from '../types';

// Helper for custom emoji markers
const createEmojiIcon = (emoji: string, color: string): L.DivIcon => {
  return L.divIcon({
    html: `<span style="font-size: 24px; text-shadow: 0 0 2px #000, 0 0 2px #000, 0 0 3px ${color};">${emoji}</span>`,
    className: 'leaflet-emoji-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 30], // Center bottom of the emoji
  });
};

interface PointMarkerProps {
  point: Point;
  category: Category;
  onEditPoint: (point: Point) => void;
}

const PointMarker: React.FC<PointMarkerProps> = ({ point, category, onEditPoint }) => {
  const map = useMap();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const openTimer = useRef<number | undefined>(undefined);
  const closeTimer = useRef<number | undefined>(undefined);
  const tooltipRef = useRef<L.Tooltip | null>(null);

  useEffect(() => {
    // On component unmount, clear any pending timers and ensure map dragging is enabled.
    return () => {
      if (openTimer.current) window.clearTimeout(openTimer.current);
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
      // It's possible to unmount while dragging is disabled, so we must re-enable it.
      if (map) {
          try {
              map.dragging.enable();
          } catch (e) {
              // This can happen if the map is also being destroyed. Safe to ignore.
          }
      }
    };
  }, [map]);


  const handleMarkerMouseOver = () => {
    window.clearTimeout(closeTimer.current);
    // Only set a timer to open the tooltip if it's not already open.
    // This prevents flickering when moving from the tooltip back to the marker.
    if (!isTooltipOpen) {
      openTimer.current = window.setTimeout(() => {
        setIsTooltipOpen(true);
      }, 300);
    }
  };

  const handleMarkerMouseOut = () => {
    window.clearTimeout(openTimer.current);
    closeTimer.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
    }, 250);
  };

  const handleTooltipMouseOver = () => {
    // When the mouse enters the tooltip, keep it open...
    window.clearTimeout(closeTimer.current);
    // ...and disable map dragging to allow text selection.
    map.dragging.disable();
  };

  const handleTooltipMouseOut = () => {
    // When the mouse leaves the tooltip, re-enable dragging...
    map.dragging.enable();
    // ...and start the timer to close the tooltip.
    closeTimer.current = window.setTimeout(() => {
      setIsTooltipOpen(false);
    }, 250);
  };

  const handleMarkerClick = () => {
    // Clear any pending timers that might open/close the tooltip.
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);

    // Immediately close the tooltip.
    setIsTooltipOpen(false);
    
    // Trigger the edit modal.
    onEditPoint(point);
  };
  
  const icon = createEmojiIcon(category.icon, category.color);

  const hasContent = point.name || point.link || point.description;
  const description = point.description || '';
  const truncatedDescription = description.length > 200 ? description.substring(0, 200) + '...' : description;

  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={icon}
      eventHandlers={{
        mouseover: handleMarkerMouseOver,
        mouseout: handleMarkerMouseOut,
        click: handleMarkerClick,
      }}
    >
      {isTooltipOpen && hasContent && (
        <Tooltip
          ref={tooltipRef}
          direction="top"
          offset={[0, -27]}
          interactive={true}
          permanent={true}
          className="custom-tooltip-container"
        >
          <div 
            onMouseOver={handleTooltipMouseOver} 
            onMouseOut={handleTooltipMouseOut}
            onClick={(e) => e.stopPropagation()}
          >
            {point.name && <h3 className="custom-tooltip-header">{point.name}</h3>}
            {point.link && (
              <a
                href={point.link}
                target="_blank"
                rel="noopener noreferrer"
                className="custom-tooltip-link"
                onClick={(e) => e.stopPropagation()} // Prevent click from bubbling to marker's edit handler
              >
                {point.link}
              </a>
            )}
            {point.description && (
              <p className="custom-tooltip-description">{truncatedDescription}</p>
            )}
          </div>
        </Tooltip>
      )}
    </Marker>
  );
};

export default PointMarker;