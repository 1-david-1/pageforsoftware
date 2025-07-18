import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, Wall, Door, Window, Floor, Room, Tool } from '../types';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CanvasProps {
  floor: Floor;
  cameras: Camera[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  rooms: Room[];
  activeTool: Tool;
  onCameraAdd: (camera: Omit<Camera, 'id'>) => void;
  onCameraUpdate: (id: string, updates: Partial<Camera>) => void;
  onCameraDelete: (id: string) => void;
  onWallAdd: (wall: Omit<Wall, 'id'>) => void;
  onWallDelete: (id: string) => void;
  onWallUpdate: (id: string, updates: Partial<Wall>) => void;
  onDoorAdd: (door: Omit<Door, 'id'>) => void;
  onDoorDelete: (id: string) => void;
  onWindowAdd: (window: Omit<Window, 'id'>) => void;
  onWindowDelete: (id: string) => void;
  onRoomAdd: (room: Omit<Room, 'id'>) => void;
  onRoomUpdate: (id: string, updates: Partial<Room>) => void;
  onRoomDelete: (id: string) => void;
  onFloorUpdate: (id: string, updates: Partial<Floor>) => void;
  onBackgroundUpload: (file: File) => void;
  onClearTemplate: () => void;
}

export default function Canvas({
  floor,
  cameras,
  walls,
  doors,
  windows,
  rooms,
  activeTool,
  onCameraAdd,
  onCameraUpdate,
  onCameraDelete,
  onWallAdd,
  onWallDelete,
  onWallUpdate,
  onDoorAdd,
  onDoorDelete,
  onWindowAdd,
  onWindowDelete,
  onRoomAdd,
  onRoomUpdate,
  onRoomDelete,
  onFloorUpdate,
  onBackgroundUpload,
  onClearTemplate
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [draggedCamera, setDraggedCamera] = useState<string | null>(null);
  const [draggedRoom, setDraggedRoom] = useState<string | null>(null);
  const [resizingRoom, setResizingRoom] = useState<{ roomId: string; handle: string } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [editingCameraName, setEditingCameraName] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState<string | null>(null);
  const [tempCameraName, setTempCameraName] = useState('');
  const [tempRoomName, setTempRoomName] = useState('');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedWall, setSelectedWall] = useState<string | null>(null);
  const [draggedWall, setDraggedWall] = useState<string | null>(null);
  const [wallDragType, setWallDragType] = useState<'start' | 'end' | 'whole' | null>(null);

  // Transform coordinates based on zoom and pan
  const transformPoint = useCallback((x: number, y: number) => {
    return {
      x: (x - floor.panX) / floor.zoom,
      y: (y - floor.panY) / floor.zoom
    };
  }, [floor.zoom, floor.panX, floor.panY]);

  const inverseTransformPoint = useCallback((x: number, y: number) => {
    return {
      x: x * floor.zoom + floor.panX,
      y: y * floor.zoom + floor.panY
    };
  }, [floor.zoom, floor.panX, floor.panY]);

  // Handle drag and drop from palette
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const cameraType = e.dataTransfer.getData('text/plain') as 'dome' | 'bullet' | 'ptz';
    const rect = canvasRef.current?.getBoundingClientRect();
    
    if (rect) {
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const { x, y } = transformPoint(screenX, screenY);
      
      // Snap to house outline in outdoor areas
      let finalX = x;
      let finalY = y;
      
      if (floor.name.toLowerCase().includes('außenbereich') || floor.name.toLowerCase().includes('garten')) {
        // Simple snapping logic for house outline
        const centerX = 400;
        const centerY = 300;
        const houseWidth = 300;
        const houseHeight = 200;
        
        const leftEdge = centerX - houseWidth / 2;
        const rightEdge = centerX + houseWidth / 2;
        const topEdge = centerY - houseHeight / 2;
        const bottomEdge = centerY + houseHeight / 2;
        
        // Snap to nearest edge
        const distances = [
          { pos: { x: leftEdge, y }, dist: Math.abs(x - leftEdge) },
          { pos: { x: rightEdge, y }, dist: Math.abs(x - rightEdge) },
          { pos: { x, y: topEdge }, dist: Math.abs(y - topEdge) },
          { pos: { x, y: bottomEdge }, dist: Math.abs(y - bottomEdge) }
        ];
        
        const nearest = distances.reduce((min, curr) => curr.dist < min.dist ? curr : min);
        if (nearest.dist < 50) {
          finalX = nearest.pos.x;
          finalY = nearest.pos.y;
        }
      }
      
      onCameraAdd({
        type: cameraType,
        name: `${cameraType.charAt(0).toUpperCase() + cameraType.slice(1)} ${cameras.length + 1}`,
        x: finalX,
        y: finalY,
        size: 40,
        floorId: floor.id
      });
    }
  }, [floor, cameras.length, onCameraAdd, transformPoint]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle mouse events for drawing walls
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse button or Ctrl+click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - floor.panX, y: e.clientY - floor.panY });
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = transformPoint(screenX, screenY);
    
    if (activeTool === 'wall') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setCurrentMousePos({ x, y });
    } else if (activeTool === 'room') {
      setIsDrawing(true);
      setDrawStart({ x, y });
      setCurrentMousePos({ x, y });
    } else if (activeTool === 'door' || activeTool === 'window') {
      // Find nearest wall
      const nearestWall = findNearestWall(x, y, walls);
      if (nearestWall) {
        const { point, wallId } = nearestWall;
        if (activeTool === 'door') {
          onDoorAdd({
            x: point.x,
            y: point.y,
            angle: calculateWallAngle(walls.find(w => w.id === wallId)!),
            floorId: floor.id,
            wallId
          });
        } else {
          onWindowAdd({
            x: point.x,
            y: point.y,
            angle: calculateWallAngle(walls.find(w => w.id === wallId)!),
            floorId: floor.id,
            wallId
          });
        }
      }
    } else if (activeTool === 'eraser') {
      handleErase(x, y);
    } else if (activeTool === 'select') {
      // Handle camera selection and dragging
      const clickedCamera = cameras.find(camera => 
        Math.abs(camera.x - x) < camera.size / 2 && 
        Math.abs(camera.y - y) < camera.size / 2
      );
      
      if (clickedCamera) {
        setSelectedCamera(clickedCamera.id);
        setDraggedCamera(clickedCamera.id);
        setDragOffset({ x: x - clickedCamera.x, y: y - clickedCamera.y });
        setIsDragging(true);
        return;
      } else {
        setSelectedCamera(null);
      }

      // Handle room selection and dragging
      const clickedRoom = rooms.find(room => 
        x >= room.x && x <= room.x + room.width &&
        y >= room.y && y <= room.y + room.height
      );
      
      if (clickedRoom) {
        // Check if clicking on resize handle
        const handleSize = 8;
        const handles = [
          { id: 'nw', x: clickedRoom.x, y: clickedRoom.y },
          { id: 'ne', x: clickedRoom.x + clickedRoom.width, y: clickedRoom.y },
          { id: 'sw', x: clickedRoom.x, y: clickedRoom.y + clickedRoom.height },
          { id: 'se', x: clickedRoom.x + clickedRoom.width, y: clickedRoom.y + clickedRoom.height }
        ];
        
        const clickedHandle = handles.find(handle => 
          Math.abs(handle.x - x) < handleSize && Math.abs(handle.y - y) < handleSize
        );
        
        if (clickedHandle) {
          setResizingRoom({ roomId: clickedRoom.id, handle: clickedHandle.id });
        } else {
          setSelectedRoom(clickedRoom.id);
          setSelectedCamera(null);
          setDraggedRoom(clickedRoom.id);
          setDragOffset({ x: x - clickedRoom.x, y: y - clickedRoom.y });
          setIsDragging(true);
        }
        return;
      } else {
        setSelectedRoom(null);
      }

      // Handle wall selection and dragging
      const clickedWall = walls.find(wall => 
        distanceToLine(x, y, wall.startX, wall.startY, wall.endX, wall.endY) < 15
      );
      
      if (clickedWall) {
        setSelectedWall(clickedWall.id);
        setSelectedCamera(null);
        setSelectedRoom(null);
        
        // Check if clicking near start or end point for point dragging
        const distToStart = Math.sqrt(Math.pow(x - clickedWall.startX, 2) + Math.pow(y - clickedWall.startY, 2));
        const distToEnd = Math.sqrt(Math.pow(x - clickedWall.endX, 2) + Math.pow(y - clickedWall.endY, 2));
        
        if (distToStart < 20) {
          setWallDragType('start');
          setDraggedWall(clickedWall.id);
          setIsDragging(true);
        } else if (distToEnd < 20) {
          setWallDragType('end');
          setDraggedWall(clickedWall.id);
          setIsDragging(true);
        } else {
          setWallDragType('whole');
          setDraggedWall(clickedWall.id);
          const wall = clickedWall;
          setDragOffset({ 
            x: x - (wall.startX + wall.endX) / 2, 
            y: y - (wall.startY + wall.endY) / 2 
          });
          setIsDragging(true);
        }
        return;
      } else {
        setSelectedWall(null);
      }
    }
  }, [activeTool, walls, cameras, rooms, floor, onDoorAdd, onWindowAdd, transformPoint]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = transformPoint(screenX, screenY);
    
    // Update current mouse position for drawing preview
    if (isDrawing) {
      setCurrentMousePos({ x, y });
    }

    if (isPanning && panStart) {
      const newPanX = e.clientX - panStart.x;
      const newPanY = e.clientY - panStart.y;
      onFloorUpdate(floor.id, { panX: newPanX, panY: newPanY });
      return;
    }
    
    if (draggedCamera && isDragging) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      onCameraUpdate(draggedCamera, { x: newX, y: newY });
    } else if (draggedRoom && isDragging) {
      const newX = x - dragOffset.x;
      const newY = y - dragOffset.y;
      onRoomUpdate(draggedRoom, { x: newX, y: newY });
    } else if (draggedWall && isDragging) {
      const wall = walls.find(w => w.id === draggedWall);
      if (wall) {
        if (wallDragType === 'start') {
          onWallUpdate(draggedWall, { startX: x, startY: y });
        } else if (wallDragType === 'end') {
          onWallUpdate(draggedWall, { endX: x, endY: y });
        } else if (wallDragType === 'whole') {
          const centerX = x - dragOffset.x;
          const centerY = y - dragOffset.y;
          const currentCenterX = (wall.startX + wall.endX) / 2;
          const currentCenterY = (wall.startY + wall.endY) / 2;
          const deltaX = centerX - currentCenterX;
          const deltaY = centerY - currentCenterY;
          
          onWallUpdate(draggedWall, {
            startX: wall.startX + deltaX,
            startY: wall.startY + deltaY,
            endX: wall.endX + deltaX,
            endY: wall.endY + deltaY
          });
        }
      }
    } else if (resizingRoom) {
      const room = rooms.find(r => r.id === resizingRoom.roomId);
      if (room) {
        const { handle } = resizingRoom;
        let updates: Partial<Room> = {};
        
        if (handle === 'se') {
          updates.width = Math.max(50, x - room.x);
          updates.height = Math.max(50, y - room.y);
        } else if (handle === 'sw') {
          const newWidth = Math.max(50, room.x + room.width - x);
          updates.x = room.x + room.width - newWidth;
          updates.width = newWidth;
          updates.height = Math.max(50, y - room.y);
        } else if (handle === 'ne') {
          updates.width = Math.max(50, x - room.x);
          const newHeight = Math.max(50, room.y + room.height - y);
          updates.y = room.y + room.height - newHeight;
          updates.height = newHeight;
        } else if (handle === 'nw') {
          const newWidth = Math.max(50, room.x + room.width - x);
          const newHeight = Math.max(50, room.y + room.height - y);
          updates.x = room.x + room.width - newWidth;
          updates.y = room.y + room.height - newHeight;
          updates.width = newWidth;
          updates.height = newHeight;
        }
        
        onRoomUpdate(resizingRoom.roomId, updates);
      }
    }
  }, [draggedCamera, draggedRoom, resizingRoom, dragOffset, onCameraUpdate, onRoomUpdate, isDragging, isPanning, panStart, floor.id, onFloorUpdate, transformPoint, rooms, isDrawing]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }

    if (activeTool === 'wall' && isDrawing && drawStart && currentMousePos) {
      // Auto-straighten near horizontal/vertical lines
      let endX = currentMousePos.x;
      let endY = currentMousePos.y;
      
      const deltaX = Math.abs(currentMousePos.x - drawStart.x);
      const deltaY = Math.abs(currentMousePos.y - drawStart.y);
      
      if (deltaX > deltaY) {
        // More horizontal, make it horizontal
        if (deltaY < 15) {
          endY = drawStart.y;
        }
      } else {
        // More vertical, make it vertical
        if (deltaX < 15) {
          endX = drawStart.x;
        }
      }
      
      onWallAdd({
        startX: drawStart.x,
        startY: drawStart.y,
        endX,
        endY,
        floorId: floor.id
      });
    } else if (activeTool === 'room' && isDrawing && drawStart && currentMousePos) {
      const width = Math.abs(currentMousePos.x - drawStart.x);
      const height = Math.abs(currentMousePos.y - drawStart.y);
      
      if (width > 20 && height > 20) {
        onRoomAdd({
          name: `Raum ${rooms.length + 1}`,
          x: Math.min(drawStart.x, currentMousePos.x),
          y: Math.min(drawStart.y, currentMousePos.y),
          width,
          height,
          floorId: floor.id
        });
      }
    }
    
    setIsDrawing(false);
    setDrawStart(null);
    setCurrentMousePos(null);
    setDraggedRoom(null);
    setResizingRoom(null);
    setDraggedCamera(null);
    setDraggedWall(null);
    setWallDragType(null);
    setIsDragging(false);
  }, [activeTool, isDrawing, drawStart, currentMousePos, floor.id, onWallAdd, onRoomAdd, rooms.length, transformPoint]);

  const handleErase = useCallback((x: number, y: number) => {
    // Check cameras
    const clickedCamera = cameras.find(camera => 
      Math.abs(camera.x - x) < camera.size / 2 && 
      Math.abs(camera.y - y) < camera.size / 2
    );
    if (clickedCamera) {
      onCameraDelete(clickedCamera.id);
      return;
    }
    
    // Check rooms
    const clickedRoom = rooms.find(room => 
      x >= room.x && x <= room.x + room.width &&
      y >= room.y && y <= room.y + room.height
    );
    if (clickedRoom) {
      onRoomDelete(clickedRoom.id);
      return;
    }
    
    // Check walls
    const clickedWall = walls.find(wall => 
      distanceToLine(x, y, wall.startX, wall.startY, wall.endX, wall.endY) < 10
    );
    if (clickedWall) {
      onWallDelete(clickedWall.id);
      return;
    }
    
    // Check doors
    const clickedDoor = doors.find(door => 
      Math.abs(door.x - x) < 20 && Math.abs(door.y - y) < 20
    );
    if (clickedDoor) {
      onDoorDelete(clickedDoor.id);
      return;
    }
    
    // Check windows
    const clickedWindow = windows.find(window => 
      Math.abs(window.x - x) < 20 && Math.abs(window.y - y) < 20
    );
    if (clickedWindow) {
      onWindowDelete(clickedWindow.id);
      return;
    }
  }, [cameras, rooms, walls, doors, windows, onCameraDelete, onRoomDelete, onWallDelete, onDoorDelete, onWindowDelete]);

  const handleCameraNameEdit = useCallback((cameraId: string, newName: string) => {
    onCameraUpdate(cameraId, { name: newName });
    setEditingCameraName(null);
    setTempCameraName('');
  }, [onCameraUpdate]);

  const handleRoomNameEdit = useCallback((roomId: string, newName: string) => {
    onRoomUpdate(roomId, { name: newName });
    setEditingRoomName(null);
    setTempRoomName('');
  }, [onRoomUpdate]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onBackgroundUpload(file);
    }
  }, [onBackgroundUpload]);

  // Zoom functions
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(3, floor.zoom * 1.2);
    onFloorUpdate(floor.id, { zoom: newZoom });
  }, [floor.zoom, floor.id, onFloorUpdate]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(0.3, floor.zoom * 0.8);
    onFloorUpdate(floor.id, { zoom: newZoom });
  }, [floor.zoom, floor.id, onFloorUpdate]);

  const handleResetView = useCallback(() => {
    onFloorUpdate(floor.id, { zoom: 1, panX: 0, panY: 0 });
  }, [floor.id, onFloorUpdate]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(3, floor.zoom * delta));
      onFloorUpdate(floor.id, { zoom: newZoom });
    }
  }, [floor.zoom, floor.id, onFloorUpdate]);

  // Utility functions
  const findNearestWall = (x: number, y: number, walls: Wall[]) => {
    let nearest = null;
    let minDistance = Infinity;
    
    walls.forEach(wall => {
      const distance = distanceToLine(x, y, wall.startX, wall.startY, wall.endX, wall.endY);
      if (distance < minDistance && distance < 20) {
        minDistance = distance;
        const point = closestPointOnLine(x, y, wall.startX, wall.startY, wall.endX, wall.endY);
        nearest = { point, wallId: wall.id };
      }
    });
    
    return nearest;
  };

  const distanceToLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const closestPointOnLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return { x: x1, y: y1 };
    
    const param = Math.max(0, Math.min(1, dot / lenSq));
    
    return {
      x: x1 + param * C,
      y: y1 + param * D
    };
  };

  const calculateWallAngle = (wall: Wall) => {
    return Math.atan2(wall.endY - wall.startY, wall.endX - wall.startX);
  };

  // Create template walls using useEffect to avoid infinite re-renders
  useEffect(() => {
    if (!floor.backgroundImage) {
      const templateWalls = walls.filter(w => w.id.startsWith(`template-${floor.template}-`));
      
      if (templateWalls.length === 0) {
        if ((floor.name.toLowerCase().includes('außenbereich') || floor.name.toLowerCase().includes('garten')) && floor.template === 'house') {
          // House template
          const centerX = 400;
          const centerY = 300;
          const houseWidth = 300;
          const houseHeight = 200;
          
          onWallAdd({ startX: centerX - houseWidth / 2, startY: centerY - houseHeight / 2, endX: centerX - houseWidth / 2, endY: centerY + houseHeight / 2, floorId: floor.id }, `template-${floor.template}-left`);
          onWallAdd({ startX: centerX + houseWidth / 2, startY: centerY - houseHeight / 2, endX: centerX + houseWidth / 2, endY: centerY + houseHeight / 2, floorId: floor.id }, `template-${floor.template}-right`);
          onWallAdd({ startX: centerX - houseWidth / 2, startY: centerY - houseHeight / 2, endX: centerX + houseWidth / 2, endY: centerY - houseHeight / 2, floorId: floor.id }, `template-${floor.template}-top`);
          onWallAdd({ startX: centerX - houseWidth / 2, startY: centerY + houseHeight / 2, endX: centerX + houseWidth / 2, endY: centerY + houseHeight / 2, floorId: floor.id }, `template-${floor.template}-bottom`);
          onWallAdd({ startX: centerX - houseWidth / 2, startY: centerY - houseHeight / 2, endX: centerX, endY: centerY - houseHeight / 2 - 50, floorId: floor.id }, `template-${floor.template}-roof-left`);
          onWallAdd({ startX: centerX, startY: centerY - houseHeight / 2 - 50, endX: centerX + houseWidth / 2, endY: centerY - houseHeight / 2, floorId: floor.id }, `template-${floor.template}-roof-right`);
        } else if (floor.template === 'rectangle') {
          // Rectangle template
          const centerX = 400;
          const centerY = 300;
          const width = 400;
          const height = 300;
          
          onWallAdd({ startX: centerX - width / 2, startY: centerY - height / 2, endX: centerX - width / 2, endY: centerY + height / 2, floorId: floor.id }, `template-${floor.template}-left`);
          onWallAdd({ startX: centerX + width / 2, startY: centerY - height / 2, endX: centerX + width / 2, endY: centerY + height / 2, floorId: floor.id }, `template-${floor.template}-right`);
          onWallAdd({ startX: centerX - width / 2, startY: centerY - height / 2, endX: centerX + width / 2, endY: centerY - height / 2, floorId: floor.id }, `template-${floor.template}-top`);
          onWallAdd({ startX: centerX - width / 2, startY: centerY + height / 2, endX: centerX + width / 2, endY: centerY + height / 2, floorId: floor.id }, `template-${floor.template}-bottom`);
        }
      }
    }
  }, [floor.id, floor.template, floor.name, floor.backgroundImage, walls, onWallAdd]);

  // Handle tool actions
  useEffect(() => {
    if (activeTool === 'upload') {
      fileInputRef.current?.click();
    } else if (activeTool === 'clear') {
      onClearTemplate();
    }
  }, [activeTool, onClearTemplate]);

  const getCameraIcon = (type: string) => {
    switch (type) {
      case 'dome':
        return '🔴';
      case 'bullet':
        return '🔷';
      case 'ptz':
        return '⚡';
      default:
        return '📹';
    }
  };

  return (
    <div className="flex-1 bg-gray-200 relative overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white rounded-lg shadow-md p-2">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-gray-100 rounded"
          title="Herauszoomen"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium px-2">
          {Math.round(floor.zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-gray-100 rounded"
          title="Hineinzoomen"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2 hover:bg-gray-100 rounded ml-2"
          title="Ansicht zurücksetzen"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      
      <div
        ref={canvasRef}
        className="w-full h-full relative cursor-crosshair"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={() => {
          if (!isDragging) {
            setSelectedCamera(null);
            setSelectedRoom(null);
          }
        }}
        style={{
          backgroundImage: floor.backgroundImage ? `url(${floor.backgroundImage})` : 'none',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          transform: `scale(${floor.zoom}) translate(${floor.panX / floor.zoom}px, ${floor.panY / floor.zoom}px)`,
          transformOrigin: '0 0'
        }}
      >
        {/* Render walls */}
        <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
          {walls.map(wall => (
            <line
              key={wall.id}
              x1={wall.startX * floor.zoom + floor.panX}
              y1={wall.startY * floor.zoom + floor.panY}
              x2={wall.endX * floor.zoom + floor.panX}
              y2={wall.endY * floor.zoom + floor.panY}
              stroke={wall.id.startsWith('template-') ? "#9CA3AF" : (selectedWall === wall.id ? "#3B82F6" : "#374151")}
              strokeWidth={wall.id.startsWith('template-') ? "2" : "4"}
              strokeDasharray={wall.id.startsWith('template-') ? "5,5" : "none"}
              strokeLinecap="round"
            />
          ))}
          
          {/* Render wall control points for selected wall */}
          {selectedWall && walls.find(w => w.id === selectedWall) && (
            <>
              {(() => {
                const wall = walls.find(w => w.id === selectedWall)!;
                return (
                  <>
                    <circle
                      cx={wall.startX * floor.zoom + floor.panX}
                      cy={wall.startY * floor.zoom + floor.panY}
                      r="6"
                      fill="#3B82F6"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx={wall.endX * floor.zoom + floor.panX}
                      cy={wall.endY * floor.zoom + floor.panY}
                      r="6"
                      fill="#3B82F6"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                );
              })()}
            </>
          )}
        </svg>
        
        {/* Render doors */}
        {doors.map(door => (
          <g key={door.id}>
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {/* Door frame */}
              <line
                x1={(door.x - 15) * floor.zoom + floor.panX}
                y1={door.y * floor.zoom + floor.panY}
                x2={(door.x + 15) * floor.zoom + floor.panX}
                y2={door.y * floor.zoom + floor.panY}
                stroke="#f59e0b"
                strokeWidth="3"
                transform={`rotate(${door.angle * 180 / Math.PI} ${door.x * floor.zoom + floor.panX} ${door.y * floor.zoom + floor.panY})`}
              />
              {/* Door swing arc */}
              <path
                d={`M ${(door.x - 15) * floor.zoom + floor.panX} ${door.y * floor.zoom + floor.panY} A ${15 * floor.zoom} ${15 * floor.zoom} 0 0 1 ${door.x * floor.zoom + floor.panX} ${(door.y - 15) * floor.zoom + floor.panY}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1"
                strokeDasharray="3,2"
                transform={`rotate(${door.angle * 180 / Math.PI} ${door.x * floor.zoom + floor.panX} ${door.y * floor.zoom + floor.panY})`}
              />
            </svg>
            <div
              className="absolute text-xs font-bold text-amber-600 pointer-events-none"
              style={{
                left: door.x * floor.zoom + floor.panX,
                top: door.y * floor.zoom + floor.panY - 20,
                transform: 'translate(-50%, 0)'
              }}
            >
              T
            </div>
          </g>
        ))}
        
        {/* Render windows */}
        {windows.map(window => (
          <g key={window.id}>
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {/* Window frame */}
              <line
                x1={(window.x - 12) * floor.zoom + floor.panX}
                y1={window.y * floor.zoom + floor.panY}
                x2={(window.x + 12) * floor.zoom + floor.panX}
                y2={window.y * floor.zoom + floor.panY}
                stroke="#3b82f6"
                strokeWidth="2"
                transform={`rotate(${window.angle * 180 / Math.PI} ${window.x * floor.zoom + floor.panX} ${window.y * floor.zoom + floor.panY})`}
              />
              {/* Window opening lines */}
              <line
                x1={(window.x - 8) * floor.zoom + floor.panX}
                y1={window.y * floor.zoom + floor.panY}
                x2={(window.x - 8) * floor.zoom + floor.panX}
                y2={(window.y - 8) * floor.zoom + floor.panY}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="2,1"
                transform={`rotate(${window.angle * 180 / Math.PI} ${window.x * floor.zoom + floor.panX} ${window.y * floor.zoom + floor.panY})`}
              />
              <line
                x1={(window.x + 8) * floor.zoom + floor.panX}
                y1={window.y * floor.zoom + floor.panY}
                x2={(window.x + 8) * floor.zoom + floor.panX}
                y2={(window.y - 8) * floor.zoom + floor.panY}
                stroke="#3b82f6"
                strokeWidth="1"
                strokeDasharray="2,1"
                transform={`rotate(${window.angle * 180 / Math.PI} ${window.x * floor.zoom + floor.panX} ${window.y * floor.zoom + floor.panY})`}
              />
            </svg>
            <div
              className="absolute text-xs font-bold text-blue-600 pointer-events-none"
              style={{
                left: window.x * floor.zoom + floor.panX,
                top: window.y * floor.zoom + floor.panY - 20,
                transform: 'translate(-50%, 0)'
              }}
            >
              F
            </div>
          </g>
        ))}
        
        {/* Render rooms */}
        {rooms.map(room => (
          <div key={room.id} className="absolute">
            {/* Room rectangle */}
            <div
              className={`border-2 border-dashed border-gray-400 bg-gray-50 bg-opacity-30 ${
                selectedRoom === room.id ? 'border-blue-500' : ''
              }`}
              style={{
                left: room.x * floor.zoom + floor.panX,
                top: room.y * floor.zoom + floor.panY,
                width: room.width * floor.zoom,
                height: room.height * floor.zoom
              }}
            />
            
            {/* Room name */}
            <div
              className="absolute flex items-center justify-center text-sm font-medium text-gray-700 cursor-pointer"
              style={{
                left: room.x * floor.zoom + floor.panX,
                top: room.y * floor.zoom + floor.panY,
                width: room.width * floor.zoom,
                height: room.height * floor.zoom
              }}
              onClick={(e) => {
                e.stopPropagation();
                setEditingRoomName(room.id);
                setTempRoomName(room.name);
              }}
            >
              {editingRoomName === room.id ? (
                <input
                  type="text"
                  value={tempRoomName}
                  onChange={(e) => setTempRoomName(e.target.value)}
                  onBlur={() => handleRoomNameEdit(room.id, tempRoomName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRoomNameEdit(room.id, tempRoomName);
                    if (e.key === 'Escape') {
                      setEditingRoomName(null);
                      setTempRoomName('');
                    }
                  }}
                  className="bg-white border border-gray-300 rounded px-2 py-1 text-center"
                  autoFocus
                />
              ) : (
                room.name
              )}
            </div>
            
            {/* Resize handles */}
            {selectedRoom === room.id && (
              <>
                <div
                  className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"
                  style={{ left: room.x * floor.zoom + floor.panX - 4, top: room.y * floor.zoom + floor.panY - 4 }}
                />
                <div
                  className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"
                  style={{ left: (room.x + room.width) * floor.zoom + floor.panX - 4, top: room.y * floor.zoom + floor.panY - 4 }}
                />
                <div
                  className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"
                  style={{ left: room.x * floor.zoom + floor.panX - 4, top: (room.y + room.height) * floor.zoom + floor.panY - 4 }}
                />
                <div
                  className="absolute w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"
                  style={{ left: (room.x + room.width) * floor.zoom + floor.panX - 4, top: (room.y + room.height) * floor.zoom + floor.panY - 4 }}
                />
              </>
            )}
          </div>
        ))}
        
        {/* Render cameras */}
        {cameras.map(camera => (
          <div
            key={camera.id}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer ${
              selectedCamera === camera.id ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              left: camera.x * floor.zoom + floor.panX,
              top: camera.y * floor.zoom + floor.panY,
              width: camera.size * floor.zoom,
              height: camera.size * floor.zoom
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedCamera(camera.id);
            }}
            onMouseDown={(e) => {
              if (activeTool === 'select') {
                e.stopPropagation();
                setSelectedCamera(camera.id);
                setDraggedCamera(camera.id);
                const rect = canvasRef.current?.getBoundingClientRect();
                if (rect) {
                  const screenX = e.clientX - rect.left;
                  const screenY = e.clientY - rect.top;
                  const { x, y } = transformPoint(screenX, screenY);
                  setDragOffset({ x: x - camera.x, y: y - camera.y });
                  setIsDragging(true);
                }
              }
            }}
          >
            <div
              className="w-full h-full bg-gray-800 rounded-full flex items-center justify-center text-white text-lg"
              style={{ fontSize: camera.size * floor.zoom * 0.4 }}
            >
              {getCameraIcon(camera.type)}
            </div>
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium text-gray-800 whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                setEditingCameraName(camera.id);
                setTempCameraName(camera.name);
              }}
            >
              {editingCameraName === camera.id ? (
                <input
                  type="text"
                  value={tempCameraName}
                  onChange={(e) => setTempCameraName(e.target.value)}
                  onBlur={() => handleCameraNameEdit(camera.id, tempCameraName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCameraNameEdit(camera.id, tempCameraName);
                    if (e.key === 'Escape') {
                      setEditingCameraName(null);
                      setTempCameraName('');
                    }
                  }}
                  className="bg-transparent border-none outline-none"
                  autoFocus
                />
              ) : (
                camera.name
              )}
            </div>
            
            {/* Resize handle */}
            {selectedCamera === camera.id && (
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const startSize = camera.size;
                  const startX = e.clientX;
                  const startY = e.clientY;
                  
                  const handleMouseMove = (e: MouseEvent) => {
                    const deltaX = e.clientX - startX;
                    const deltaY = e.clientY - startY;
                    const delta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    const newSize = Math.max(20, Math.min(100, startSize + delta * 0.5));
                    onCameraUpdate(camera.id, { size: newSize });
                  };
                  
                  const handleMouseUp = () => {
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
              />
            )}
          </div>
        ))}
        
        {/* Drawing preview */}
        {isDrawing && drawStart && currentMousePos && (
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {activeTool === 'wall' && (
              <line
                x1={drawStart.x * floor.zoom + floor.panX}
                y1={drawStart.y * floor.zoom + floor.panY}
                x2={(() => {
                  const deltaX = Math.abs(currentMousePos.x - drawStart.x);
                  const deltaY = Math.abs(currentMousePos.y - drawStart.y);
                  
                  if (deltaX > deltaY && deltaY < 15) {
                    return currentMousePos.x * floor.zoom + floor.panX; // Make horizontal
                  } else if (deltaX <= deltaY && deltaX < 15) {
                    return drawStart.x * floor.zoom + floor.panX; // Make vertical
                  }
                  return currentMousePos.x * floor.zoom + floor.panX;
                })()}
                y2={(() => {
                  const deltaX = Math.abs(currentMousePos.x - drawStart.x);
                  const deltaY = Math.abs(currentMousePos.y - drawStart.y);
                  
                  if (deltaX > deltaY && deltaY < 15) {
                    return drawStart.y * floor.zoom + floor.panY; // Make horizontal
                  } else if (deltaX <= deltaY && deltaX < 15) {
                    return currentMousePos.y * floor.zoom + floor.panY; // Make vertical
                  }
                  return currentMousePos.y * floor.zoom + floor.panY;
                })()}
                stroke="#6B7280"
                strokeWidth="4"
                strokeDasharray="8,4"
                strokeLinecap="round"
              />
            )}
            {activeTool === 'room' && (
              <rect
                x={Math.min(drawStart.x, currentMousePos.x) * floor.zoom + floor.panX}
                y={Math.min(drawStart.y, currentMousePos.y) * floor.zoom + floor.panY}
                width={Math.abs(currentMousePos.x - drawStart.x) * floor.zoom}
                height={Math.abs(currentMousePos.y - drawStart.y) * floor.zoom}
                fill="none"
                stroke="#6B7280"
                strokeWidth="2"
                strokeDasharray="5,3"
              />
            )}
          </svg>
        )}
      </div>
    </div>
  );
}