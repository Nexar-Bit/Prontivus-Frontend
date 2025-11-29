# EmptyState Component Usage Guide

## Overview

The `EmptyState` component provides a consistent way to display "no data" notifications throughout the application. It automatically detects whether the empty state is due to:
- Empty database (no data stored)
- Filtered results (data exists but doesn't match filters)
- Errors (failed to load data)

## Basic Usage

```tsx
import { EmptyState } from "@/components/ui/empty-state";

// Simple empty state
<EmptyState />

// With custom message
<EmptyState
  title="Nenhum paciente encontrado"
  description="Não há pacientes cadastrados no sistema."
/>

// Database empty state (default variant)
<EmptyState
  variant="database"
  title="Nenhum dado armazenado no banco de dados"
  description="Não há dados cadastrados no banco de dados."
/>
```

## Variants

### 1. `database` (Default)
Use when the database is truly empty - no data exists at all.

```tsx
<EmptyState
  variant="database"
  title="Nenhum dado armazenado no banco de dados"
  description="Não há dados cadastrados no banco de dados. Os dados aparecerão aqui quando forem adicionados ao sistema."
/>
```

### 2. `filter`
Use when data exists but doesn't match the current filters/search.

```tsx
<EmptyState
  variant="filter"
  title="Nenhum resultado encontrado"
  description="Não há dados que correspondam aos filtros selecionados."
  action={{
    label: "Limpar filtros",
    onClick: () => clearFilters()
  }}
/>
```

### 3. `default`
Generic empty state for general use cases.

```tsx
<EmptyState
  variant="default"
  title="Nenhum dado encontrado"
  description="Não há dados disponíveis para exibição no momento."
/>
```

### 4. `error`
Use when there's an error loading data.

```tsx
<EmptyState
  variant="error"
  title="Erro ao carregar dados"
  description="Não foi possível carregar os dados do banco de dados."
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | `Database` | Custom icon component |
| `title` | `string` | Variant-specific | Main title/message |
| `description` | `string` | Variant-specific | Optional description |
| `action` | `{ label: string, onClick: () => void }` | `undefined` | Optional action button |
| `variant` | `"default" \| "database" \| "filter" \| "error"` | `"default"` | Style variant |
| `className` | `string` | `undefined` | Custom className |
| `asCard` | `boolean` | `true` | Wrap in Card component |

## Examples

### Example 1: Patients List with Search

```tsx
{filteredPatients.length === 0 ? (
  <EmptyState
    icon={Users}
    variant={searchTerm ? "filter" : "database"}
    title={searchTerm ? "Nenhum paciente encontrado" : "Nenhum paciente cadastrado no banco de dados"}
    description={searchTerm 
      ? "Não há pacientes que correspondam à sua busca."
      : "Não há pacientes cadastrados no banco de dados."
    }
    action={searchTerm ? {
      label: "Limpar busca",
      onClick: () => setSearchTerm("")
    } : {
      label: "Cadastrar Paciente",
      onClick: () => setShowForm(true)
    }}
  />
) : (
  // ... render patients list
)}
```

### Example 2: Test Results

```tsx
{!loading && reports.length === 0 && (
  <EmptyState
    icon={TestTube}
    variant="database"
    title="Nenhum resultado de exame encontrado"
    description="Não há resultados de exames armazenados no banco de dados."
  />
)}
```

### Example 3: With Custom Icon

```tsx
<EmptyState
  icon={FileText}
  variant="database"
  title="Nenhum documento encontrado"
  description="Não há documentos cadastrados no banco de dados."
/>
```

## Best Practices

1. **Use `database` variant** when the database table is empty
2. **Use `filter` variant** when data exists but is filtered out
3. **Always provide a helpful description** explaining why there's no data
4. **Include action buttons** when appropriate (e.g., "Clear filters", "Add new item")
5. **Use appropriate icons** that match the context (Users, FileText, TestTube, etc.)

## Integration with API Responses

The component works seamlessly with API responses. When an endpoint returns an empty array:

```tsx
const { data, isLoading } = useSWR('/api/v1/patients', fetcher);

{!isLoading && (!data || data.length === 0) && (
  <EmptyState
    variant="database"
    title="Nenhum paciente cadastrado no banco de dados"
    description="Não há pacientes armazenados no banco de dados. Os pacientes aparecerão aqui quando forem adicionados ao sistema."
  />
)}
```

## Styling

The component uses Tailwind CSS and follows the design system:
- Card wrapper with colored left border
- Icon in colored circular background
- Consistent spacing and typography
- Responsive design

Custom styling can be applied via the `className` prop.

