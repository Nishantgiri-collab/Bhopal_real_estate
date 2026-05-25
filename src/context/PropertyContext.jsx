import { createContext, useCallback, useState, useEffect, useContext } from 'react';

const PropertyContext = createContext();

export const useProperties = () => useContext(PropertyContext);

const API = 'http://localhost:5000/api';

export const PropertyProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/properties`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      } else {
        setError('Failed to load properties from SQLite.');
        console.error('Failed to fetch properties from server');
      }
    } catch (err) {
      setError('Cannot connect to the property API. Start the backend server on port 5000.');
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
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
    let persistentImages = [];
    if (newProp.imageFiles && newProp.imageFiles.length > 0) {
      for (let i = 0; i < newProp.imageFiles.length; i++) {
        try {
          const compressed = await compressImage(newProp.imageFiles[i]);
          if (compressed) {
            persistentImages.push(compressed);
          }
        } catch (e) {
          console.warn('Failed compressing image', i, e);
        }
      }
    }

    const primaryImage = persistentImages[0] || newProp.image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";

    const propertyWithId = {
      ...newProp,
      image: primaryImage,
      images: persistentImages.length > 0 ? persistentImages : [primaryImage],
      id: Date.now(),
      isAiMatch: Math.random() > 0.5,
      matchScore: Math.floor(Math.random() * 20) + 80,
      isLiked: false,
      isSold: false,
      isApproved: false // Newly submitted listings are pending approval by default
    };

    delete propertyWithId.imageFiles;

    try {
      const res = await fetch(`${API}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(propertyWithId)
      });
      if (res.ok) {
        const saved = await res.json();
        setProperties(prev => [saved, ...prev]);
        return saved;
      } else {
        const message = await res.text();
        console.error('Failed to add property to SQLite database');
        throw new Error(message || 'Failed to add property to SQLite database');
      }
    } catch (err) {
      console.error('Error adding property:', err);
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
