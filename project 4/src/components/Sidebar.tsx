import React from 'react';
import { Camera, Shield, Zap, PaintBucket, Upload, Trash2, Square, DoorOpen, Settings, FileText, List, Home } from 'lucide-react';
import { Tool } from '../types';

interface SidebarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onGenerateMaterialList: () => void;
  onGenerateGDPRReport: () => void;
  materialList: string[];
  isGeneratingReport: boolean;
}

export default function Sidebar({ 
  activeTool, 
  onToolChange, 
  onGenerateMaterialList, 
  onGenerateGDPRReport,
  materialList,
  isGeneratingReport
}: SidebarProps) {
  const handleDragStart = (e: React.DragEvent, cameraType: 'dome' | 'bullet' | 'ptz') => {
    e.dataTransfer.setData('text/plain', cameraType);
  };

  const toolButtons = [
    { id: 'select' as Tool, icon: Settings, label: 'Auswählen' },
    { id: 'wall' as Tool, icon: Square, label: 'Wände zeichnen' },
    { id: 'room' as Tool, icon: Home, label: 'Raum erstellen' },
    { id: 'door' as Tool, icon: DoorOpen, label: 'Tür hinzufügen' },
    { id: 'window' as Tool, icon: Square, label: 'Fenster hinzufügen' },
    { id: 'eraser' as Tool, icon: Trash2, label: 'Radierer' },
    { id: 'upload' as Tool, icon: Upload, label: 'Grundriss hochladen' },
    { id: 'clear' as Tool, icon: PaintBucket, label: 'Vorlage löschen' },
  ];

  return (
    <div className="w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-800 mb-8">PlanSec</h1>
        
        {/* Camera Palette */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Kamera-Palette</h2>
          <div className="space-y-3">
            <div 
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'dome')}
            >
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Dome-Kamera</span>
            </div>
            <div 
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'bullet')}
            >
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Bullet-Kamera</span>
            </div>
            <div 
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
              draggable
              onDragStart={(e) => handleDragStart(e, 'ptz')}
            >
              <Zap className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">PTZ-Kamera</span>
            </div>
          </div>
        </div>

        {/* Layout Tools */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Layout-Werkzeuge</h2>
          <div className="grid grid-cols-2 gap-2">
            {toolButtons.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTool === tool.id
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tool.icon className="w-4 h-4" />
                <span className="text-xs">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Assistant */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">KI-Assistent</h2>
          <button
            onClick={onGenerateGDPRReport}
            disabled={isGeneratingReport}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isGeneratingReport ? 'Generiere...' : 'DSGVO-Bericht'}
            </span>
          </button>
        </div>

        {/* Material List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Materialliste</h2>
          <button
            onClick={onGenerateMaterialList}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mb-4"
          >
            <List className="w-4 h-4" />
            <span className="text-sm font-medium">Materialliste erzeugen</span>
          </button>
          
          {materialList.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {materialList.map((item, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}