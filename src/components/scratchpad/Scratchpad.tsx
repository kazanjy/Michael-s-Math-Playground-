import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Eraser, Trash2, Undo } from 'lucide-react';

export interface ScratchpadHandle {
  getImage: () => string | null;
}

interface ScratchpadProps {
  onClear?: () => void;
  className?: string;
  disabled?: boolean;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  lineWidth: number;
}

export const Scratchpad = forwardRef<ScratchpadHandle, ScratchpadProps>(function Scratchpad({ onClear, className = '', disabled = false }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const [clearedStrokes, setClearedStrokes] = useState<Stroke[] | null>(null);

  const penColor = '#1e293b'; // Slate-800
  const eraserColor = '#f8fafc'; // Slate-50 (background color)
  const lineWidth = 3;
  const eraserWidth = 20;

  // Set up canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Set display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      // Set actual size in memory
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      // Scale context to match device pixel ratio
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redrawCanvas();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when strokes change
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Clear canvas
    ctx.fillStyle = '#f8fafc'; // Slate-50 background
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    // Draw grid lines (subtle)
    ctx.strokeStyle = '#e2e8f0'; // Slate-200
    ctx.lineWidth = 1;
    const gridSize = 20;

    for (let x = gridSize; x < canvas.width / dpr; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height / dpr);
      ctx.stroke();
    }

    for (let y = gridSize; y < canvas.height / dpr; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width / dpr, y);
      ctx.stroke();
    }

    // Draw all strokes
    strokes.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    // Draw current stroke
    if (currentStroke) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  };

  const getPointFromEvent = (e: React.TouchEvent | React.MouseEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled) return;

    const point = getPointFromEvent(e);
    if (!point) return;

    setIsDrawing(true);
    setCurrentStroke({
      points: [point],
      color: isEraser ? eraserColor : penColor,
      lineWidth: isEraser ? eraserWidth : lineWidth,
    });
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled) return;

    const point = getPointFromEvent(e);
    if (!point || !currentStroke) return;

    setCurrentStroke(prev => {
      if (!prev) return null;
      return {
        ...prev,
        points: [...prev.points, point],
      };
    });
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke && currentStroke.points.length > 1) {
      setStrokes(prev => [...prev, currentStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke(null);
  };

  const handleUndo = () => {
    if (strokes.length === 0 && clearedStrokes) {
      // Undo the clear: restore all previously cleared strokes
      setStrokes(clearedStrokes);
      setClearedStrokes(null);
    } else {
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (strokes.length > 0) {
      setClearedStrokes(strokes);
    }
    setStrokes([]);
    onClear?.();
  };

  const toggleEraser = () => {
    setIsEraser(!isEraser);
  };

  // Get canvas as data URL for saving
  const getCanvasImage = useCallback((): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  useImperativeHandle(ref, () => ({ getImage: getCanvasImage }), [getCanvasImage]);

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-slate-100 rounded-t-xl border border-b-0 border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleEraser}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors ${
              isEraser
                ? 'bg-slate-800 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-200'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title={isEraser ? 'Switch to Pen' : 'Switch to Eraser'}
          >
            <Eraser className="w-5 h-5" />
          </button>
          <button
            onClick={handleUndo}
            disabled={disabled || (strokes.length === 0 && !clearedStrokes)}
            className={`p-2 rounded-lg bg-white text-slate-600 hover:bg-slate-200 transition-colors ${
              disabled || (strokes.length === 0 && !clearedStrokes) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={strokes.length === 0 && clearedStrokes ? 'Undo Clear' : 'Undo'}
          >
            <Undo className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-slate-500 font-medium">
          {isEraser ? 'Eraser Mode' : 'Pen Mode'}
        </div>

        <button
          onClick={handleClear}
          disabled={disabled || strokes.length === 0}
          className={`p-2 rounded-lg bg-white text-red-500 hover:bg-red-50 transition-colors ${
            disabled || strokes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Clear All"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 bg-slate-50 rounded-b-xl border border-slate-200 overflow-hidden touch-none"
        style={{ minHeight: '200px' }}
      >
        <canvas
          ref={canvasRef}
          className={`w-full h-full ${disabled ? 'opacity-50' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{ touchAction: 'none' }}
        />
      </div>
    </div>
  );
});
