import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { Floor } from '../types';

interface FloorTabsProps {
  floors: Floor[];
  activeFloorId: string;
  onFloorChange: (floorId: string) => void;
  onAddFloor: () => void;
  onRenameFloor: (floorId: string, newName: string) => void;
  onDeleteFloor: (floorId: string) => void;
}

export default function FloorTabs({ 
  floors, 
  activeFloorId, 
  onFloorChange, 
  onAddFloor, 
  onRenameFloor, 
  onDeleteFloor 
}: FloorTabsProps) {
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleStartEdit = (floor: Floor) => {
    setEditingFloor(floor.id);
    setEditValue(floor.name);
  };

  const handleSaveEdit = () => {
    if (editingFloor && editValue.trim()) {
      onRenameFloor(editingFloor, editValue.trim());
    }
    setEditingFloor(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingFloor(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center space-x-2">
        {floors.map((floor) => (
          <div
            key={floor.id}
            className={`group relative flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
              activeFloorId === floor.id
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => onFloorChange(floor.id)}
          >
            {editingFloor === floor.id ? (
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="bg-transparent border-b border-current text-sm font-medium focus:outline-none min-w-0"
                  autoFocus
                />
                <button
                  onClick={handleSaveEdit}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">{floor.name}</span>
                <div className="hidden group-hover:flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(floor);
                    }}
                    className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {floors.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFloor(floor.id);
                      }}
                      className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        
        <button
          onClick={onAddFloor}
          className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}