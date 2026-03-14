"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Filter, X } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
}

interface Board {
  id: string;
  name: string;
  workspaceId: string;
}

interface AnalyticsFiltersProps {
  workspaces: Workspace[];
  boards: Board[];
  selectedWorkspace: string | null;
  selectedBoard: string | null;
  onWorkspaceChange: (workspaceId: string | null) => void;
  onBoardChange: (boardId: string | null) => void;
  onClearFilters: () => void;
}

export function AnalyticsFilters({
  workspaces,
  boards,
  selectedWorkspace,
  selectedBoard,
  onWorkspaceChange,
  onBoardChange,
  onClearFilters
}: AnalyticsFiltersProps) {
  const filteredBoards = selectedWorkspace
    ? boards.filter(board => board.workspaceId === selectedWorkspace)
    : boards;

  const selectedWorkspaceName = workspaces.find(w => w.id === selectedWorkspace)?.name;
  const selectedBoardName = boards.find(b => b.id === selectedBoard)?.name;

  const hasActiveFilters = selectedWorkspace || selectedBoard;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Фильтры</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Фильтр по рабочему пространству */}
        <div>
          <label className="text-sm font-medium">Рабочее пространство</label>
          <Select
            value={selectedWorkspace || ""}
            onValueChange={(value) => onWorkspaceChange(value || null)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Все пространства" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все пространства</SelectItem>
              {workspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Фильтр по доске */}
        <div>
          <label className="text-sm font-medium">Доска</label>
          <Select
            value={selectedBoard || ""}
            onValueChange={(value) => onBoardChange(value || null)}
            disabled={!selectedWorkspace && filteredBoards.length > 0}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={selectedWorkspace ? "Выберите доску" : "Сначала выберите пространство"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все доски</SelectItem>
              {filteredBoards.map((board) => (
                <SelectItem key={board.id} value={board.id}>
                  {board.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Активные фильтры */}
        {hasActiveFilters && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Активные фильтры:</p>
            <div className="space-y-1">
              {selectedWorkspaceName && (
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="h-3 w-3" />
                  <span>Пространство: {selectedWorkspaceName}</span>
                </div>
              )}
              {selectedBoardName && (
                <div className="flex items-center gap-2 text-xs">
                  <Filter className="h-3 w-3" />
                  <span>Доска: {selectedBoardName}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
