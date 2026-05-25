# Skill: Web UX/UI Design Standard (Modern Stack)

## Description
Estándares de diseño de alta gama para aplicaciones web, optimizados para Tailwind CSS v4, shadcn/ui y Lucide Icons. Se enfoca en una estética limpia, profesional (tipo SaaS empresarial) y alta interactividad.

## Instructions

### 1. Design Tokens & v4 Integration
- **Variables CSS**: Prefiere el uso de variables nativas de CSS definidas en el entry point del proyecto (ej: `--color-primary`, `--radius-lg`).
- **Color Palette**: 
    - Fondos: `bg-background` para el cuerpo, `bg-card` o `bg-secondary/50` para elevaciones.
    - Contraste: Títulos en `text-foreground` (900), cuerpo en `text-muted-foreground` (600).
- **Glassmorphism**: Para elementos flotantes (headers/navs), usar `bg-background/80 backdrop-blur-md sticky top-0 z-50`.

### 2. Component Standards (shadcn/ui)
- **Visual Smoothness**: 
    - Bordes: Estandarizar en `rounded-xl` para componentes pequeños y `rounded-2xl` para contenedores grandes.
    - Bordes sutiles: Usar `border-border/50` para un look más "soft".
- **DataTable Excellence**:
    - Las celdas deben tener `py-4` para airear el contenido.
    - Badges: Usar variantes `outline` o `secondary` con indicadores de color (semáforo).
- **Forms**: 
    - Agrupar con `space-y-4`. 
    - Siempre incluir `placeholder` descriptivos y `description` debajo de campos complejos.

### 3. Motion & Feedback (React 19)
- **Interactive States**: Todos los elementos clickeables deben incluir `transition-colors` y `active:scale-95`.
- **Hover**: Usar `hover:bg-accent hover:text-accent-foreground` para consistencia con shadcn.
- **Loading**: Implementar Skeletons que imiten la forma exacta del componente final para evitar el layout shift (CLS).
- **Icons**: Usar un tamaño consistente, generalmente `size-4` o `size-5`.

### 4. Layout Architecture
- **Constraints**: En vistas de escritorio, usar `container mx-auto px-4 md:px-6`.
- **Grid System**: Usar `grid-cols-1 md:grid-cols-2 lg:grid-cols-12` para layouts complejos, evitando que las columnas colapsen de forma abrupta.
- **Empty States**: Siempre definir un estado visual para listas vacías (Icono + Título + Acción principal).

### 5. Typography Standards
- **Hierarchy**: 
    - H1: `text-3xl font-bold tracking-tight`.
    - Subtítulos: `text-sm text-muted-foreground`.
- **Readability**: Máximo de 65-75 caracteres por línea en bloques de texto para mejorar la lectura.

## Technical Constraints
- No usar valores arbitrarios (ej: `p-[17px]`). Usar siempre la escala de Tailwind.
- Prohibido el uso de `!important` en el código de componentes.
- El diseño debe ser 100% funcional sin necesidad de usar el mouse (navegación por teclado).