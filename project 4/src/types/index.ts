export interface Camera {
  id: string;
  type: 'dome' | 'bullet' | 'ptz';
  name: string;
  x: number;
  y: number;
  size: number;
  floorId: string;
}

export interface Wall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  floorId: string;
}

export interface Door {
  id: string;
  x: number;
  y: number;
  angle: number;
  floorId: string;
  wallId: string;
}

export interface Window {
  id: string;
  x: number;
  y: number;
  angle: number;
  floorId: string;
  wallId: string;
}

export interface Floor {
  id: string;
  name: string;
  template: 'house' | 'rectangle' | null;
  backgroundImage?: string;
  zoom: number;
  panX: number;
  panY: number;
}

export interface Room {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floorId: string;
}

export type Tool = 'select' | 'wall' | 'door' | 'window' | 'room' | 'eraser' | 'upload' | 'clear';

export interface MaterialItem {
  type: string;
  count: number;
  description: string;
}