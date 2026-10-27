<?php

namespace App\Http\Controllers;

use App\Models\ManagerReport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ManagerController extends Controller
{
    public function inbox()
    {
        $reports = ManagerReport::with('creator')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'type' => $r->type,
                'period_start' => $r->period_start->format('M d, Y'),
                'period_end' => $r->period_end->format('M d, Y'),
                'metrics_data' => $r->metrics_data,
                'status' => $r->status,
                'validation_notes' => $r->validation_notes,
                'created_by_name' => $r->creator->name ?? 'System',
                'created_at' => $r->created_at->format('M d, Y H:i'),
                'validated_at' => $r->validated_at ? $r->validated_at->format('M d, Y H:i') : null,
            ]);

        return Inertia::render('portal/manager/reports', [
            'reports' => $reports,
        ]);
    }

    public function validateReport(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $report = ManagerReport::where('status', 'submitted')->findOrFail($id);

        $report->update([
            'status' => 'validated',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('manager.reports')->with('success', 'Report validated successfully.');
    }

    public function rejectReport(Request $request, $id)
    {
        $validated = $request->validate([
            'notes' => 'required|string|max:1000',
        ]);

        $report = ManagerReport::where('status', 'submitted')->findOrFail($id);

        $report->update([
            'status' => 'rejected',
            'validated_at' => now(),
            'validated_by' => Auth::id(),
            'validation_notes' => $validated['notes'],
        ]);

        return redirect()->route('manager.reports')->with('success', 'Report rejected.');
    }
}
