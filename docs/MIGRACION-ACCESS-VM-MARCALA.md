# Migración funcional desde V&M Marcala

La base Access se usa únicamente como inventario de funciones y fuente histórica. NESLAB no copiará su estructura fragmentada.

## Funciones que se pueden migrar

- Pacientes, médicos y fechas históricas, con deduplicación previa.
- Resultados de química, hematología, uroanálisis, heces, serología, cultivos y otros exámenes.
- Opciones cualitativas utilizadas por el personal.
- Formatos clínicos de informes que sigan siendo necesarios.
- Búsquedas históricas y listados por fecha o área.
- Tarjeta de salud, reconstruida sobre órdenes, catálogo y resultados de NESLAB.

## Reglas obligatorias

- Nunca importar las 108 tablas como tablas equivalentes en NESLAB.
- Cada columna clínica debe mapearse a un examen y parámetro configurables.
- Conservar tabla, identificador y fecha de origen como trazabilidad de migración.
- No unir pacientes dudosos automáticamente.
- No publicar un resultado migrado sin validación de unidad y referencia.
- Mostrar e imprimir nombres clínicos; los IDs internos solo sirven para relaciones de base de datos.

## Tarjeta de salud

El defecto observado en Access imprime el identificador del examen. En NESLAB la tarjeta deberá almacenar la relación interna con el examen, pero obtener la etiqueta visible desde el catálogo y guardar también una copia histórica del nombre.

Criterio de aceptación: en pantalla, impresión y PDF aparece `examName`; `labExamId` nunca se presenta al paciente.

## Orden recomendado

1. Construir la matriz tabla/columna de Access → examen/parámetro NESLAB.
2. Implementar reactivos, lotes y referencias versionadas.
3. Implementar Tarjeta de salud usando el catálogo normalizado.
4. Crear importador con vista previa, conteos y archivo de errores.
5. Ejecutar una migración de ensayo sobre una base separada.
6. Comparar informes y conteos con el personal antes del cambio definitivo.

