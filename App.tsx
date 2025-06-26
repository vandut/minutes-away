
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { LatLng } from 'leaflet';
import type { Category, Point, IsochroneFetchResult } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapComponent from './components/MapComponent';
import AddPointModal from './components/AddPointModal';
import ProgressBar from './components/ProgressBar';
import RateLimitModal from './components/RateLimitModal';
import SettingsModal from './components/SettingsModal';
import EditCategoryModal from './components/EditCategoryModal';
import ConfirmationModal from './components/ConfirmationModal'; // Import new modal
import { getIsochrone, getCurrentMinuteRequestCount, getCurrentDailyRequestCount } from './services/apiService';
import { 
  INITIAL_TRAVEL_TIME_MINUTES,
  LOCALSTORAGE_CATEGORIES_KEY,
  LOCALSTORAGE_POINTS_KEY,
  LOCALSTORAGE_ORS_API_KEY, 
  ORS_MINUTE_LIMIT,
  ORS_DAILY_LIMIT,
  LOCALSTORAGE_HAS_INITIALIZED_CATEGORIES_KEY
} from './constants';

const App: React.FC = () => {
  const [categories, setCategories] = useLocalStorage<Category[]>(LOCALSTORAGE_CATEGORIES_KEY, []);
  const [points, setPoints] = useLocalStorage<Point[]>(LOCALSTORAGE_POINTS_KEY, []);
  
  const [displayTravelTime, setDisplayTravelTime] = useState<number>(INITIAL_TRAVEL_TIME_MINUTES);
  const [committedTravelTime, setCommittedTravelTime] = useState<number>(INITIAL_TRAVEL_TIME_MINUTES);
  
  const [isochroneResults, setIsochroneResults] = useState<Record<string, IsochroneFetchResult>>({});
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [apiAlertMessage, setApiAlertMessage] = useState<string | null>(null);

  const [isAddPointModalOpen, setIsAddPointModalOpen] = useState<boolean>(false);
  const [newPointCoords, setNewPointCoords] = useState<LatLng | null>(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [currentApiMinuteCount, setCurrentApiMinuteCount] = useState<number>(0);
  const [currentApiDailyCount, setCurrentApiDailyCount] = useState<number>(0);
  
  const [isApiKeyConfigured, setIsApiKeyConfigured] = useState<boolean>(false);

  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState<boolean>(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);

  // State for Confirmation Modal
  const [confirmationModalState, setConfirmationModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirmAction: (() => void) | null;
  }>({ isOpen: false, title: '', message: '', onConfirmAction: null });

  const isSecondEffectInitialRun = useRef(true);

  useEffect(() => {
    const storedApiKey = localStorage.getItem(LOCALSTORAGE_ORS_API_KEY);
    if (storedApiKey && storedApiKey.trim() !== '') {
      setIsApiKeyConfigured(true);
      setIsSettingsModalOpen(false); 
    } else {
      setIsApiKeyConfigured(false);
      setIsSettingsModalOpen(true); 
    }
  }, []);

  useEffect(() => {
    setCategories(prevCategories =>
        prevCategories.map(cat => {
            const migratedCat = {...cat};
            if (migratedCat.generateIsochrones === undefined) {
                migratedCat.generateIsochrones = true;
            }
            if (migratedCat.isVisible === undefined) { 
                migratedCat.isVisible = true;
            }
            return migratedCat;
        })
    );
  }, [setCategories]); 

  useEffect(() => {
    const hasInitializedCategories = localStorage.getItem(LOCALSTORAGE_HAS_INITIALIZED_CATEGORIES_KEY);
    if (categories.length === 0 && !hasInitializedCategories) {
        const defaultCategory: Category = {
            id: 'default-category-1',
            name: 'General',
            color: '#808080', 
            icon: '📍',
            isVisible: true,
            generateIsochrones: true,
        };
        setCategories([defaultCategory]);
        localStorage.setItem(LOCALSTORAGE_HAS_INITIALIZED_CATEGORIES_KEY, 'true');
    } else if (categories.length > 0 && !hasInitializedCategories) {
        localStorage.setItem(LOCALSTORAGE_HAS_INITIALIZED_CATEGORIES_KEY, 'true');
    }
  }, [categories, setCategories]);


  const fetchAllIsochrones = useCallback(async (timeToUse: number, forceRefetch = false) => {
    if (!isApiKeyConfigured) {
      setApiAlertMessage("API Key is not configured. Please set it in Settings.");
      setIsLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
      if (!isSettingsModalOpen) {
        setIsSettingsModalOpen(true);
      }
      return;
    }

    const currentPoints = points; 
    const currentCategories = categories;

    const pointsToFetch = currentPoints.filter(p => {
      const category = currentCategories.find(c => c.id === p.categoryId);
      return p.isVisible && category?.isVisible && category?.generateIsochrones;
    });

    if (pointsToFetch.length === 0) {
      const activePointIds = new Set(pointsToFetch.map(p => p.id));
      setIsochroneResults(prevResults => {
          const newResults: Record<string, IsochroneFetchResult> = {};
          for (const pointId in prevResults) {
              if (activePointIds.has(pointId)) {
                  newResults[pointId] = prevResults[pointId];
              }
          }
          return newResults;
      });
      setIsLoading(false);
      setLoadingProgress({ current: 0, total: 0 });
      return;
    }

    setIsLoading(true);
    setLoadingProgress({ current: 0, total: pointsToFetch.length });
    setApiAlertMessage(null); 

    const newResultsBatch: Record<string, IsochroneFetchResult> = {};
    let fetchedCount = 0;
    let rateLimitErrorOccurred = false;
    let alertHasBeenSetThisBatch = false; 

    for (const point of pointsToFetch) {
      if (rateLimitErrorOccurred && !forceRefetch) { 
        newResultsBatch[point.id] = { error: "Fetching skipped due to an earlier error in this batch." };
        fetchedCount++; 
        setLoadingProgress(prev => ({ ...prev, current: fetchedCount }));
        continue;
      }
      
      const result = await getIsochrone(point.lat, point.lng, timeToUse, { forceRefetch });
      fetchedCount++;
      setLoadingProgress(prev => ({ ...prev, current: fetchedCount }));

      if (result.error) {
        newResultsBatch[point.id] = { error: result.error };

        if (!alertHasBeenSetThisBatch) {
          setApiAlertMessage(result.error);
          alertHasBeenSetThisBatch = true;
        }

        const lowerError = result.error.toLowerCase();
        const isApiKeyError = lowerError.includes("api key") || 
                              lowerError.includes("unauthorized") || 
                              lowerError.includes("not set") ||
                              lowerError.includes("configure it in the settings") || 
                              lowerError.includes("configured"); 

        const isRateLimitError = lowerError.includes("limit") || lowerError.includes("429");

        if (isApiKeyError) {
          setIsSettingsModalOpen(true); 
        }
        
        if (isApiKeyError || isRateLimitError) {
          rateLimitErrorOccurred = true; 
        }

      } else if (result.data) {
        newResultsBatch[point.id] = { geojson: result.data };
      }
    }
    
    setIsochroneResults(prevResults => {
        const updatedResults = {...prevResults, ...newResultsBatch};
        const finalResults: Record<string, IsochroneFetchResult> = {};
        currentPoints.forEach(p => {
            const category = currentCategories.find(c => c.id === p.categoryId);
            if (category?.generateIsochrones && updatedResults[p.id]) {
                finalResults[p.id] = updatedResults[p.id];
            }
        });
        return finalResults;
    });
    setIsLoading(false);
  }, [points, categories, isApiKeyConfigured, isSettingsModalOpen]); 

  useEffect(() => {
    const localIsInitialRun = isSecondEffectInitialRun.current;
    if (localIsInitialRun) {
      isSecondEffectInitialRun.current = false;
    }

    if (isApiKeyConfigured) {
      fetchAllIsochrones(committedTravelTime, false);
    } else { 
      if (!localIsInitialRun && (points.length > 0 || categories.length > 0)) {
        if (!isSettingsModalOpen) { 
          setIsSettingsModalOpen(true); 
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [committedTravelTime, points, categories, isApiKeyConfigured]); 


  const handleRefresh = () => {
    if (!isApiKeyConfigured) {
      setApiAlertMessage("Cannot refresh: API Key is not configured. Please set it in Settings.");
      if(!isSettingsModalOpen) setIsSettingsModalOpen(true);
      return;
    }
    setApiAlertMessage(null); 
    if (displayTravelTime !== committedTravelTime) {
        setCommittedTravelTime(displayTravelTime); 
        fetchAllIsochrones(displayTravelTime, true); 
    } else {
        fetchAllIsochrones(committedTravelTime, true); 
    }
  };
  
  const handleTravelTimeDisplayChange = (newTime: number) => {
    setDisplayTravelTime(newTime);
  };

  const handleTravelTimeCommitChange = (finalTime: number) => {
    if (!isApiKeyConfigured) {
      setApiAlertMessage("Cannot change travel time: API Key is not configured. Please set it in Settings.");
      if(!isSettingsModalOpen) setIsSettingsModalOpen(true);
      return;
    }
    setApiAlertMessage(null); 
    setDisplayTravelTime(finalTime); 
    setCommittedTravelTime(finalTime); 
  };

  const handleAddCategory = (name: string, color: string, icon: string, generateIsochrones: boolean) => {
    const newCategory: Category = { 
      id: Date.now().toString(), 
      name, 
      color, 
      icon, 
      isVisible: true,
      generateIsochrones 
    };
    setCategories(prev => [...prev, newCategory]);
  };
  
  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;

    setConfirmationModalState({
      isOpen: true,
      title: 'Delete Category',
      message: `Are you sure you want to delete the category "${categoryToDelete.name}"? All points within this category will also be deleted. This action cannot be undone.`,
      onConfirmAction: () => {
        const pointsInDeletedCategory = points.filter(p => p.categoryId === id).map(p => p.id);
        setCategories(prev => prev.filter(c => c.id !== id));
        setPoints(prev => prev.filter(p => p.categoryId !== id));
        setIsochroneResults(prevIso => {
            const newIso = {...prevIso};
            pointsInDeletedCategory.forEach(pointId => delete newIso[pointId]);
            return newIso;
        });
      }
    });
  };

  const handleToggleCategoryVisibility = (id: string) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  };
  
  const handleDeletePoint = (id: string) => {
    const pointToDelete = points.find(p => p.id === id);
    if (!pointToDelete) return;

    setConfirmationModalState({
      isOpen: true,
      title: 'Delete Point',
      message: `Are you sure you want to delete the point "${pointToDelete.name || `Point ID: ${pointToDelete.id.substring(0,6)}`}"? This action cannot be undone.`,
      onConfirmAction: () => {
        setPoints(prev => prev.filter(p => p.id !== id));
        setIsochroneResults(prevIso => {
            const newIso = {...prevIso};
            delete newIso[id];
            return newIso;
        });
      }
    });
  };

  const handleTogglePointVisibility = (id: string) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, isVisible: !p.isVisible } : p));
  };

  const handleMapClick = (latlng: LatLng) => {
    if (!isApiKeyConfigured) {
      setApiAlertMessage("Cannot add point: API Key is not configured. Please set it in Settings.");
      if(!isSettingsModalOpen) setIsSettingsModalOpen(true);
      return;
    }
    if (categories.length === 0) {
      setApiAlertMessage("Please add a category first before placing points on the map.");
      return;
    }
    setNewPointCoords(latlng);
    setIsAddPointModalOpen(true);
  };

  const handleAddPoint = (categoryId: string, pointName?: string) => {
    if (newPointCoords) {
      const newPoint: Point = {
        id: Date.now().toString(),
        categoryId,
        lat: newPointCoords.lat,
        lng: newPointCoords.lng,
        isVisible: true,
        name: pointName
      };
      setPoints(prev => [...prev, newPoint]);
    }
    setIsAddPointModalOpen(false);
    setNewPointCoords(null);
  };

  const handleOpenSettingsModal = () => {
    setCurrentApiMinuteCount(getCurrentMinuteRequestCount());
    setCurrentApiDailyCount(getCurrentDailyRequestCount());
    setIsSettingsModalOpen(true);
  };

  const handleCloseSettingsModal = () => {
    if (isApiKeyConfigured || !isSettingsModalOpen || (isSettingsModalOpen && isApiKeyConfigured)) {
       setIsSettingsModalOpen(false);
    } else if (isSettingsModalOpen && !isApiKeyConfigured) {
        setApiAlertMessage("API Key is required to use the application. Please enter a valid key.");
    }
  };
  
  const handleApiKeySaved = () => {
    const storedApiKey = localStorage.getItem(LOCALSTORAGE_ORS_API_KEY);
    if (storedApiKey && storedApiKey.trim() !== '') {
        setIsApiKeyConfigured(true);
        setIsSettingsModalOpen(false); 
        setApiAlertMessage(null); 
        if (points.length > 0 && !isLoading) { 
           fetchAllIsochrones(committedTravelTime, false); 
        }
    } else {
        setIsApiKeyConfigured(false);
        setApiAlertMessage("API Key was not saved correctly or is empty. Please try again.");
    }
  };

  const handleOpenEditCategoryModal = (category: Category) => {
    setCategoryToEdit(category);
    setIsEditCategoryModalOpen(true);
  };

  const handleCloseEditCategoryModal = () => {
    setCategoryToEdit(null);
    setIsEditCategoryModalOpen(false);
  };

  const handleSaveEditedCategory = (id: string, name: string, color: string, icon: string, generateIsochrones: boolean) => {
    setCategories(prevCategories =>
      prevCategories.map(cat =>
        cat.id === id ? { ...cat, name, color, icon, generateIsochrones } : cat
      )
    );
    handleCloseEditCategoryModal();
  };

  const handleExecuteConfirmation = () => {
    if (confirmationModalState.onConfirmAction) {
      confirmationModalState.onConfirmAction();
    }
    setConfirmationModalState({ isOpen: false, title: '', message: '', onConfirmAction: null });
  };

  const handleCloseConfirmationModal = () => {
    setConfirmationModalState({ isOpen: false, title: '', message: '', onConfirmAction: null });
  };


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (confirmationModalState.isOpen) {
          handleCloseConfirmationModal();
        } else if (isEditCategoryModalOpen) {
          handleCloseEditCategoryModal();
        } else if (isSettingsModalOpen) {
          if (isApiKeyConfigured) { 
            handleCloseSettingsModal();
          }
        } else if (isAddPointModalOpen) {
           setIsAddPointModalOpen(false);
           setNewPointCoords(null);
        } else if (apiAlertMessage) {
            setApiAlertMessage(null); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
      isSettingsModalOpen, 
      isApiKeyConfigured, 
      handleCloseSettingsModal, 
      isAddPointModalOpen, 
      apiAlertMessage, 
      isEditCategoryModalOpen, 
      handleCloseEditCategoryModal,
      confirmationModalState.isOpen,
      handleCloseConfirmationModal
    ]);


  return (
    <div className="flex flex-col h-screen antialiased">
      <Header
        travelTime={displayTravelTime}
        onTravelTimeDisplayChange={handleTravelTimeDisplayChange}
        onTravelTimeCommitChange={handleTravelTimeCommitChange}
        onRefresh={handleRefresh}
        isLoading={isLoading}
        onOpenSettings={handleOpenSettingsModal}
        isApiKeyConfigured={isApiKeyConfigured}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          categories={categories}
          points={points}
          onAddCategory={handleAddCategory}
          onToggleCategoryVisibility={handleToggleCategoryVisibility}
          onTogglePointVisibility={handleTogglePointVisibility}
          onDeleteCategory={handleDeleteCategory}
          onDeletePoint={handleDeletePoint}
          onOpenEditCategoryModal={handleOpenEditCategoryModal}
        />
        <main className="flex-1 relative z-0">
          <MapComponent
            points={points}
            categories={categories}
            isochrones={isochroneResults}
            onMapClick={handleMapClick}
          />
        </main>
      </div>

      {isAddPointModalOpen && newPointCoords && (
        <AddPointModal
          categories={categories}
          onClose={() => {
            setIsAddPointModalOpen(false);
            setNewPointCoords(null);
          }}
          onAddPoint={handleAddPoint}
        />
      )}

      {isLoading && loadingProgress.total > 0 && loadingProgress.current < loadingProgress.total && isApiKeyConfigured && (
        <ProgressBar current={loadingProgress.current} total={loadingProgress.total} />
      )}
      
      {apiAlertMessage && (
        <RateLimitModal message={apiAlertMessage} onClose={() => setApiAlertMessage(null)} />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          onClose={handleCloseSettingsModal}
          minuteCount={currentApiMinuteCount}
          dailyCount={currentApiDailyCount}
          minuteLimit={ORS_MINUTE_LIMIT}
          dailyLimit={ORS_DAILY_LIMIT}
          isInitialSetup={!isApiKeyConfigured} 
          onApiKeySaved={handleApiKeySaved}
        />
      )}

      {isEditCategoryModalOpen && categoryToEdit && (
        <EditCategoryModal
          categoryToEdit={categoryToEdit}
          onClose={handleCloseEditCategoryModal}
          onSaveCategory={handleSaveEditedCategory}
        />
      )}

      {confirmationModalState.isOpen && (
        <ConfirmationModal
          isOpen={confirmationModalState.isOpen}
          title={confirmationModalState.title}
          message={confirmationModalState.message}
          onConfirm={handleExecuteConfirmation}
          onCancel={handleCloseConfirmationModal}
        />
      )}
    </div>
  );
};

export default App;
