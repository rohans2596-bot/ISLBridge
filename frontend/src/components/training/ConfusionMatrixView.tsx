import React, { useState } from 'react';
import { Grid, Info } from 'lucide-react';

interface ConfusionMatrixViewProps {
  matrix?: number[][];
  classes: string[];
}

export const ConfusionMatrixView: React.FC<ConfusionMatrixViewProps> = ({ matrix, classes }) => {
  const [hoveredCell, setHoveredCell] = useState<{ actual: string; pred: string; count: number } | null>(null);

  if (!matrix || matrix.length === 0 || classes.length === 0) {
    return (
      <div className="p-8 rounded-3xl glass-panel text-center text-xs text-slate-500">
        No confusion matrix available yet. Train a model to evaluate predictions.
      </div>
    );
  }

  // Display max top 12 classes in matrix view to maintain crisp readability
  const displayClasses = classes.slice(0, 12);
  const matrixSlice = matrix.slice(0, 12).map(row => row.slice(0, 12));

  // Find max value in matrix for normalization
  let maxVal = 1;
  matrixSlice.forEach(row => row.forEach(val => { if (val > maxVal) maxVal = val; }));

  return (
    <div className="p-6 rounded-3xl glass-panel border border-stone-200/80 space-y-4 shadow-sm">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 border border-sky-300">
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-800 uppercase tracking-wider">
              Validation Confusion Matrix Heatmap
            </h4>
            <span className="text-[10px] text-slate-500">
              Showing top {displayClasses.length} classes (Actual vs Predicted)
            </span>
          </div>
        </div>

        {hoveredCell && (
          <div className="text-[11px] font-mono bg-white px-3 py-1 rounded-xl border border-stone-200 text-slate-700 shadow-xs">
            Actual: <span className="font-bold text-slate-900">{hoveredCell.actual}</span> → Predicted: <span className="font-bold text-sky-700">{hoveredCell.pred}</span> ({hoveredCell.count} samples)
          </div>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <table className="border-collapse text-center mx-auto text-[10px] font-mono">
          <thead>
            <tr>
              <th className="p-1 text-slate-400 text-[9px] uppercase">Actual \ Pred</th>
              {displayClasses.map((c, i) => (
                <th key={i} className="p-1 text-slate-600 font-bold max-w-[50px] truncate" title={c}>
                  {c.slice(0, 4)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixSlice.map((row, rIdx) => {
              const actualClass = displayClasses[rIdx] || `C${rIdx}`;
              return (
                <tr key={rIdx}>
                  <td className="p-1 font-bold text-slate-600 text-right pr-2 max-w-[60px] truncate" title={actualClass}>
                    {actualClass.slice(0, 5)}
                  </td>
                  {row.map((val, cIdx) => {
                    const predClass = displayClasses[cIdx] || `C${cIdx}`;
                    const isDiagonal = rIdx === cIdx;
                    const intensity = Math.min(1, val / maxVal);
                    
                    let bgColor = '#F8FAFC';
                    if (val > 0) {
                      bgColor = isDiagonal
                        ? `rgba(2, 132, 199, ${Math.max(0.15, intensity * 0.85)})`
                        : `rgba(217, 119, 6, ${Math.max(0.15, intensity * 0.75)})`;
                    }

                    return (
                      <td
                        key={cIdx}
                        onMouseEnter={() => setHoveredCell({ actual: actualClass, pred: predClass, count: val })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className="p-1 border border-stone-200 cursor-pointer transition-colors"
                        style={{ backgroundColor: bgColor }}
                      >
                        <span className={isDiagonal && val > 0 ? 'text-sky-900 font-bold' : val > 0 ? 'text-amber-900 font-bold' : 'text-slate-300'}>
                          {val}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-stone-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-sky-500 inline-block border border-sky-600 shadow-2xs" />
            <span>Correct Classification (Diagonal)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block border border-amber-600 shadow-2xs" />
            <span>Misclassification Error</span>
          </div>
        </div>
      </div>

    </div>
  );
};
