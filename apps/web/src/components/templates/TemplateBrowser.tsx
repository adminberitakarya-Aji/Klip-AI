"use client";

import { useState, useCallback, useEffect } from "react";
import { TemplateCard } from "./TemplateCard";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  format: string;
  style: string;
  totalDuration: number;
  aspectRatio: string;
  shotCount: number;
  previewThumbnailUrl: string | null;
  previewVideoUrl: string | null;
  creditsCost: number;
  usageCount: number;
  rating: number | null;
  isOfficial: boolean;
  createdAt: string;
}

interface TemplateBrowserProps {
  initialTemplates?: Template[];
  initialFilters?: {
    category?: string;
    format?: string;
    style?: string;
    search?: string;
    sortBy?: string;
  };
}

export function TemplateBrowser({
  initialTemplates = [],
  initialFilters = {},
}: TemplateBrowserProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    category: initialFilters.category || "",
    format: initialFilters.format || "",
    style: initialFilters.style || "",
    search: initialFilters.search || "",
    sortBy: initialFilters.sortBy || "newest",
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);

  // Extract unique filter options from templates
  useEffect(() => {
    if (templates.length > 0) {
      setCategories([
        ...new Set(templates.map((t) => t.category).filter(Boolean)),
      ]);
      setFormats([...new Set(templates.map((t) => t.format).filter(Boolean))]);
      setStyles([...new Set(templates.map((t) => t.style).filter(Boolean))]);
    }
  }, [templates]);

  const fetchTemplates = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pageNum.toString(),
          limit: "12",
          ...(filters.category && { category: filters.category }),
          ...(filters.format && { format: filters.format }),
          ...(filters.style && { style: filters.style }),
          ...(filters.search && { search: filters.search }),
          ...(filters.sortBy && { sortBy: filters.sortBy }),
        });

        const res = await fetch(`/api/templates?${params}`);
        const data = await res.json();

        if (data.success) {
          if (append) {
            setTemplates((prev) => [...prev, ...data.data]);
          } else {
            setTemplates(data.data);
          }
          setHasMore(data.pagination.page < data.pagination.totalPages);
          setPage(data.pagination.page);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  // Fetch on filter change
  useEffect(() => {
    fetchTemplates(1, false);
  }, [fetchTemplates]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleLoadMore = () => {
    fetchTemplates(page + 1, true);
  };

  const handleClearFilters = () => {
    setFilters({
      category: "",
      format: "",
      style: "",
      search: "",
      sortBy: "newest",
    });
  };

  const hasActiveFilters =
    filters.category || filters.format || filters.style || filters.search;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Filters */}
      <aside className="lg:w-64 flex-shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Filter
            </h3>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                Bersihkan
              </button>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cari
            </label>
            <input
              type="text"
              placeholder="Nama, deskripsi, tag..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Format */}
          {formats.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Format
              </label>
              <select
                value={filters.format}
                onChange={(e) => handleFilterChange("format", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Semua Format</option>
                {formats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Style */}
          {styles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gaya
              </label>
              <select
                value={filters.style}
                onChange={(e) => handleFilterChange("style", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Semua Gaya</option>
                {styles.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Urutkan
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="popular">Paling Populer</option>
              <option value="rating">Rating Tertinggi</option>
              <option value="duration">Durasi Terpendek</option>
            </select>
          </div>
        </div>
      </aside>

      {/* Main Grid */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Template Video
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {templates.length} template ditemukan
            </p>
          </div>
        </div>

        {/* Grid */}
        {templates.length === 0 && !loading ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Tidak ada template
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Coba ubah filter atau kata kunci pencarian
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                Hapus semua filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => {
                    // Navigation handled by parent
                  }}
                />
              ))}
            </div>

            {/* Load More / Infinite Scroll */}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Memuat...
                    </span>
                  ) : (
                    "Muat Lebih Banyak"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
