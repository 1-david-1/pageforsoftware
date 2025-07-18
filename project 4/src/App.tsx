import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FloorTabs from './components/FloorTabs';
import Canvas from './components/Canvas';
import { Camera, Wall, Door, Window, Floor, Tool, MaterialItem, Room } from './types';
import { FileText, X, Loader2 } from 'lucide-react';

// Generate unique ID
const generateId = () => Math.random().toString(36).substr(2, 9);

function App() {
  const [floors, setFloors] = useState<Floor[]>([
    { id: generateId(), name: 'Erdgeschoss', template: 'rectangle', zoom: 1, panX: 0, panY: 0 }
  ]);
  const [activeFloorId, setActiveFloorId] = useState<string>(floors[0].id);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<Window[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const [materialList, setMaterialList] = useState<string[]>([]);
  const [showGDPRModal, setShowGDPRModal] = useState(false);
  const [gdprReport, setGdprReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string>('');

  const activeFloor = floors.find(f => f.id === activeFloorId) || floors[0];

  // Floor management
  const handleAddFloor = useCallback(() => {
    const newFloor: Floor = {
      id: generateId(),
      name: `Etage ${floors.length + 1}`,
      template: 'rectangle',
      zoom: 1,
      panX: 0,
      panY: 0
    };
    setFloors(prev => [...prev, newFloor]);
    setActiveFloorId(newFloor.id);
  }, [floors.length]);

  const handleRenameFloor = useCallback((floorId: string, newName: string) => {
    setFloors(prev => prev.map(floor => 
      floor.id === floorId 
        ? { 
            ...floor, 
            name: newName,
            template: newName.toLowerCase().includes('außenbereich') || newName.toLowerCase().includes('garten') ? 'house' : 'rectangle'
          } 
        : floor
    ));
  }, []);

  const handleDeleteFloor = useCallback((floorId: string) => {
    if (floors.length <= 1) return;
    
    setFloors(prev => prev.filter(floor => floor.id !== floorId));
    setCameras(prev => prev.filter(camera => camera.floorId !== floorId));
    setWalls(prev => prev.filter(wall => wall.floorId !== floorId));
    setDoors(prev => prev.filter(door => door.floorId !== floorId));
    setWindows(prev => prev.filter(window => window.floorId !== floorId));
    setRooms(prev => prev.filter(room => room.floorId !== floorId));
    
    if (activeFloorId === floorId) {
      setActiveFloorId(floors.find(f => f.id !== floorId)?.id || floors[0].id);
    }
  }, [floors, activeFloorId]);

  // Camera management
  const handleCameraAdd = useCallback((camera: Omit<Camera, 'id'>) => {
    const newCamera: Camera = {
      ...camera,
      id: generateId()
    };
    setCameras(prev => [...prev, newCamera]);
  }, []);

  const handleCameraUpdate = useCallback((id: string, updates: Partial<Camera>) => {
    setCameras(prev => prev.map(camera => 
      camera.id === id ? { ...camera, ...updates } : camera
    ));
  }, []);

  const handleCameraDelete = useCallback((id: string) => {
    setCameras(prev => prev.filter(camera => camera.id !== id));
  }, []);

  // Wall management
  const handleWallAdd = useCallback((wall: Omit<Wall, 'id'>, customId?: string) => {
    const newWall: Wall = {
      ...wall,
      id: customId || generateId()
    };
    setWalls(prev => [...prev, newWall]);
  }, []);

  const handleWallDelete = useCallback((id: string) => {
    setWalls(prev => prev.filter(wall => wall.id !== id));
    // Also remove doors and windows on this wall
    setDoors(prev => prev.filter(door => door.wallId !== id));
    setWindows(prev => prev.filter(window => window.wallId !== id));
  }, []);

  const handleWallUpdate = useCallback((id: string, updates: Partial<Wall>) => {
    setWalls(prev => prev.map(wall => 
      wall.id === id ? { ...wall, ...updates } : wall
    ));
  }, []);

  // Door management
  const handleDoorAdd = useCallback((door: Omit<Door, 'id'>) => {
    const newDoor: Door = {
      ...door,
      id: generateId()
    };
    setDoors(prev => [...prev, newDoor]);
  }, []);

  const handleDoorDelete = useCallback((id: string) => {
    setDoors(prev => prev.filter(door => door.id !== id));
  }, []);

  // Window management
  const handleWindowAdd = useCallback((window: Omit<Window, 'id'>) => {
    const newWindow: Window = {
      ...window,
      id: generateId()
    };
    setWindows(prev => [...prev, newWindow]);
  }, []);

  const handleWindowDelete = useCallback((id: string) => {
    setWindows(prev => prev.filter(window => window.id !== id));
  }, []);

  // Room management
  const handleRoomAdd = useCallback((room: Omit<Room, 'id'>) => {
    const newRoom: Room = {
      ...room,
      id: generateId()
    };
    setRooms(prev => [...prev, newRoom]);
  }, []);

  const handleRoomUpdate = useCallback((id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, ...updates } : room
    ));
  }, []);

  const handleRoomDelete = useCallback((id: string) => {
    setRooms(prev => prev.filter(room => room.id !== id));
  }, []);

  // Floor update
  const handleFloorUpdate = useCallback((updates: Partial<Floor>) => {
    setFloors(prev => prev.map(floor => 
      floor.id === activeFloorId ? { ...floor, ...updates } : floor
    ));
  }, [activeFloorId]);

  // Background upload
  const handleBackgroundUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setFloors(prev => prev.map(floor => 
        floor.id === activeFloorId 
          ? { ...floor, backgroundImage: imageUrl, template: 'custom' }
          : floor
      ));
    };
    reader.readAsDataURL(file);
  }, [activeFloorId]);

  // Clear template
  const handleClearTemplate = useCallback(() => {
    setFloors(prev => prev.map(floor => 
      floor.id === activeFloorId 
        ? { ...floor, backgroundImage: undefined, template: 'rectangle' }
        : floor
    ));
  }, [activeFloorId]);

  // Material list generation
  const handleGenerateMaterialList = useCallback(() => {
    const materialItems: MaterialItem[] = [];
    
    // Count cameras by type
    const cameraTypes = cameras.reduce((acc, camera) => {
      acc[camera.type] = (acc[camera.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(cameraTypes).forEach(([type, count]) => {
      materialItems.push({
        type: `${type.charAt(0).toUpperCase() + type.slice(1)}-Kamera`,
        count,
        description: `${count}x ${type.charAt(0).toUpperCase() + type.slice(1)}-Überwachungskamera`
      });
    });
    
    // Add installation materials
    const totalCameras = cameras.length;
    if (totalCameras > 0) {
      materialItems.push(
        { type: 'Kabel', count: totalCameras, description: `${totalCameras}x Netzwerkkabel (Cat6)` },
        { type: 'Netzteile', count: totalCameras, description: `${totalCameras}x PoE-Netzteile` },
        { type: 'Befestigung', count: totalCameras, description: `${totalCameras}x Halterungen und Schrauben` }
      );
    }
    
    // Add recorder based on camera count
    if (totalCameras > 0) {
      const recorderSize = totalCameras <= 4 ? '4-Kanal' : totalCameras <= 8 ? '8-Kanal' : '16-Kanal';
      materialItems.push({
        type: 'NVR-Recorder',
        count: 1,
        description: `1x ${recorderSize} Netzwerk-Videorekorder`
      });
    }
    
    const materialStrings = materialItems.map(item => 
      `${item.count}x ${item.type} - ${item.description}`
    );
    
    setMaterialList(materialStrings);
  }, [cameras]);

  // GDPR report generation
  const handleGenerateGDPRReport = useCallback(async () => {
    setIsGeneratingReport(true);
    setShowGDPRModal(true);
    setReportError('');
    setGdprReport('');
    
    try {
      // Collect camera data
      const cameraData = cameras.map(camera => ({
        type: camera.type,
        name: camera.name,
        floor: floors.find(f => f.id === camera.floorId)?.name || 'Unbekannt',
        position: { x: camera.x, y: camera.y }
      }));
      
      // Generate GDPR report content
      setGdprReport(`DSGVO-Bericht für Videoüberwachungsanlage

1. Rechtliche Grundlage
Die Videoüberwachung erfolgt gemäß Art. 6 Abs. 1 lit. f DSGVO zum Schutz berechtigter Interessen (Einbruchschutz).

2. Betroffene Bereiche
${cameraData.length} Kameras wurden identifiziert:
${cameraData.map(camera => `- ${camera.name} auf ${camera.floor}`).join('\n')}

3. Erforderliche Maßnahmen
- Hinweisschilder anbringen
- Speicherfristen beachten (max. 72 Stunden)
- Zugriffskontrolle implementieren
- Datenschutzerklärung erstellen

4. Technische Empfehlungen
- Verschlüsselung der Übertragung
- Sichere Passwörter verwenden
- Regelmäßige Updates

5. Dokumentationspflichten
- Verzeichnis der Verarbeitungstätigkeiten
- Technische und organisatorische Maßnahmen
- Datenschutz-Folgenabschätzung bei Bedarf

Hinweis: Dies ist eine automatisch generierte Zusammenfassung. Konsultieren Sie einen Datenschutzexperten für eine vollständige Bewertung.`);
      
    } catch (error) {
      console.error('Error generating GDPR report:', error);
      setReportError('Fehler beim Generieren des DSGVO-Berichts. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsGeneratingReport(false);
    }
  }, [cameras, floors]);

  // Tool change handler
  const handleToolChange = useCallback((tool: Tool) => {
    setActiveTool(tool);
  }, []);

  // Get filtered data for active floor
  const activeCameras = cameras.filter(c => c.floorId === activeFloorId);
  const activeWalls = walls.filter(w => w.floorId === activeFloorId);
  const activeDoors = doors.filter(d => d.floorId === activeFloorId);
  const activeWindows = windows.filter(w => w.floorId === activeFloorId);
  const activeRooms = rooms.filter(r => r.floorId === activeFloorId);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activeTool={activeTool}
        onToolChange={handleToolChange}
        onGenerateMaterialList={handleGenerateMaterialList}
        onGenerateGDPRReport={handleGenerateGDPRReport}
        materialList={materialList}
        isGeneratingReport={isGeneratingReport}
      />
      
      <div className="flex-1 flex flex-col">
        <FloorTabs
          floors={floors}
          activeFloorId={activeFloorId}
          onFloorChange={setActiveFloorId}
          onAddFloor={handleAddFloor}
          onRenameFloor={handleRenameFloor}
          onDeleteFloor={handleDeleteFloor}
        />
        
        <Canvas
          floor={activeFloor}
          cameras={activeCameras}
          walls={activeWalls}
          doors={activeDoors}
          windows={activeWindows}
          rooms={activeRooms}
          activeTool={activeTool}
          onCameraAdd={handleCameraAdd}
          onCameraUpdate={handleCameraUpdate}
          onCameraDelete={handleCameraDelete}
          onWallAdd={handleWallAdd}
          onWallDelete={handleWallDelete}
          onWallUpdate={handleWallUpdate}
          onDoorAdd={handleDoorAdd}
          onDoorDelete={handleDoorDelete}
          onWindowAdd={handleWindowAdd}
          onWindowDelete={handleWindowDelete}
          onRoomAdd={handleRoomAdd}
          onRoomUpdate={handleRoomUpdate}
          onRoomDelete={handleRoomDelete}
          onFloorUpdate={handleFloorUpdate}
          onBackgroundUpload={handleBackgroundUpload}
          onClearTemplate={handleClearTemplate}
        />
      </div>
      
      {/* GDPR Report Modal */}
      {showGDPRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                DSGVO-Bericht
              </h2>
              <button
                onClick={() => setShowGDPRModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {isGeneratingReport ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600">Generiere DSGVO-Bericht...</p>
                  </div>
                </div>
              ) : reportError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{reportError}</p>
                </div>
              ) : gdprReport ? (
                <div className="prose prose-gray max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                    {gdprReport}
                  </pre>
                </div>
              ) : null}
            </div>
            
            {!isGeneratingReport && (gdprReport || reportError) && (
              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowGDPRModal(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Schließen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;