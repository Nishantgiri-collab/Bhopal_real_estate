import { createContext, useCallback, useState, useEffect, useContext } from 'react';

const PropertyContext = createContext();

export const useProperties = () => useContext(PropertyContext);

const API = '/api';
const PROPERTY_REFRESH_INTERVAL_MS = 10000;

const clientLog = (message, details = {}) => {
  console.log(`[property-client] ${message}`, details);
};

const clientError = (message, error, details = {}) => {
  console.error(`[property-client] ${message}`, { ...details, error: error?.message || error });
};

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProperties = useCallback(async ({ background = false } = {}) => {
    if (!background) {
      setLoading(true);
    }
    setError('');
    try {
      const res = await fetch(`${API}/properties`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      } else {
        setError('Failed to load properties.');
        console.error('Failed to fetch properties from server');
      }
    } catch (err) {
      setError('Cannot connect to the property API. Please make sure the server is running.');
      console.error('Error fetching properties:', err);
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (!window.EventSource) return undefined;

    const events = new EventSource(`${API}/properties/events`);
    const refreshInBackground = () => fetchProperties({ background: true });

    events.addEventListener('property-change', refreshInBackground);
    events.onerror = () => {
      events.close();
    };

    return () => {
      events.removeEventListener('property-change', refreshInBackground);
      events.close();
    };
  }, [fetchProperties]);

  useEffect(() => {
    const refreshInBackground = () => {
      if (document.visibilityState === 'visible') {
        fetchProperties({ background: true });
      }
    };

    const intervalId = window.setInterval(refreshInBackground, PROPERTY_REFRESH_INTERVAL_MS);
    window.addEventListener('focus', refreshInBackground);
    document.addEventListener('visibilitychange', refreshInBackground);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshInBackground);
      document.removeEventListener('visibilitychange', refreshInBackground);
    };
  }, [fetchProperties]);

  // Client-side image compression to downscale megapixel camera photos down to 800px max width JPEG (30-60KB)
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIM = 800;
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = () => {
          resolve(event.target.result);
        };
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const addProperty = async (newProp) => {
    const traceId = `property-${Date.now()}`;
    clientLog('Add property started', {
      traceId,
      title: newProp.title,
      imageFiles: newProp.imageFiles?.length || 0
    });

    let persistentImages = [];
    if (newProp.imageFiles && newProp.imageFiles.length > 0) {
      for (let i = 0; i < newProp.imageFiles.length; i++) {
        try {
          clientLog('Compressing image', {
            traceId,
            index: i,
            name: newProp.imageFiles[i]?.name,
            size: newProp.imageFiles[i]?.size
          });
          const compressed = await compressImage(newProp.imageFiles[i]);
          if (compressed) {
            persistentImages.push(compressed);
            clientLog('Image compressed', { traceId, index: i, outputLength: compressed.length });
          }
        } catch (e) {
          console.warn('[property-client] Failed compressing image', { traceId, index: i, error: e?.message || e });
        }
      }
    }

    const primaryImage = persistentImages[0] || newProp.image || '';

    const propertyWithId = {
      ...newProp,
      image: primaryImage,
      images: persistentImages.length > 0 ? persistentImages : (primaryImage ? [primaryImage] : []),
      id: Date.now(),
      isAiMatch: Math.random() > 0.5,
      matchScore: Math.floor(Math.random() * 20) + 80,
      isLiked: false,
      isSold: false,
      isApproved: false // Newly submitted listings are pending approval by default
    };

    delete propertyWithId.imageFiles;

    try {
      const body = JSON.stringify(propertyWithId);
      clientLog('Sending property create request', {
        traceId,
        id: propertyWithId.id,
        bodyBytes: body.length,
        imageCount: propertyWithId.images?.length || 0
      });

      const res = await fetch(`${API}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      clientLog('Property create response received', { traceId, status: res.status, ok: res.ok });
      if (res.ok) {
        const saved = await res.json();
        clientLog('Property create succeeded', { traceId, id: saved.id, title: saved.title });
        setProperties(prev => [saved, ...prev]);
        return saved;
      } else {
        const message = await res.text();
        clientError('Property create failed', message, { traceId, status: res.status });
        throw new Error(message || 'Failed to add property to database');
      }
    } catch (err) {
      clientError('Error adding property', err, { traceId });
      throw err;
    }
  };

  const deleteProperty = async (id) => {
    try {
      const res = await fetch(`${API}/properties/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setProperties(prev => prev.filter(p => p.id !== id));
      } else {
        const message = await res.text();
        console.error('Failed to delete property from SQLite database');
        throw new Error(message || 'Failed to delete property from SQLite database');
      }
    } catch (err) {
      console.error('Error deleting property:', err);
      throw err;
    }
  };

  const updateProperty = async (id, updates) => {
    try {
      const res = await fetch(`${API}/properties/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const updated = await res.json();
        setProperties(prev => prev.map(p => p.id === id ? updated : p));
        return updated;
      } else {
        const message = await res.text();
        console.error('Failed to update property in SQLite database');
        throw new Error(message || 'Failed to update property in SQLite database');
      }
    } catch (err) {
      console.error('Error updating property:', err);
      throw err;
    }
  };

  const markPropertySold = async (id) => {
    await updateProperty(id, { isSold: true });
  };

  return (
    <PropertyContext.Provider value={{ properties, loading, error, addProperty, deleteProperty, updateProperty, markPropertySold, refetch: fetchProperties }}>
      {children}
    </PropertyContext.Provider>
  );
};
