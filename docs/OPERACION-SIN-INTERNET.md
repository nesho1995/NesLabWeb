# Manual rapido: operacion sin internet (NesLab)

Este manual ayuda a recepcion, caja y laboratorio a seguir operando cuando se cae internet.

## 1) Que ver en pantalla

- Si la app detecta que no hay internet, muestra el estado **"Sin internet"** en la barra superior.
- Tambien muestra una franja amarilla indicando modo limitado.
- Eso significa: **se puede trabajar**, pero hay funciones que deben validarse al reconectar.

## 2) Antes de una caida (buenas practicas)

- Mantener abiertos los catalogos necesarios del dia (examenes, pacientes frecuentes, formas de pago).
- Verificar impresora y papel de comprobantes.
- Tener definido quien valida sincronizacion cuando vuelva la red (normalmente caja o admin).

## 3) Durante la caida (modo operativo)

- Continuar atencion y registro.
- Si una validacion en linea falla, registrar observacion en notas (quien, hora, motivo).
- En comprobantes, usar flujo interno de atencion y conservar evidencia impresa.
- No detener toma de muestras ni entrega de resultados internos por una validacion remota.

## 4) Que evitar sin internet

- Cambios administrativos sensibles (parametros fiscales o configuracion estructural).
- Cierres definitivos si requieren confirmacion externa en tiempo real.
- Doble registro manual en sistemas paralelos sin control (genera descuadres).

## 5) Al volver internet (reconexion)

- Confirmar que el estado cambie de **"Sin internet"** a **"Conectado"**.
- Refrescar bandejas principales:
  - Bandeja de ordenes
  - Cierre de caja
  - Estado financiero
- Revisar:
  - ordenes pendientes
  - pagos y metodos
  - diferencia de caja en el periodo afectado

## 6) Checklist de cierre del incidente

- [ ] Se normalizo la conexion.
- [ ] Se revisaron ordenes y comprobantes del periodo offline.
- [ ] Se verifico que los montos de pago cuadren con caja.
- [ ] Se documentaron incidencias excepcionales (si hubo).

## 7) Roles sugeridos

- **Recepcion**: continua registro de pacientes y ordenes.
- **Caja**: controla montos y notas de diferencia.
- **Laboratorio**: mantiene flujo de muestras/resultados.
- **Admin/Gerencia**: valida estado financiero y regularizacion final.

## 8) Nota tecnica para el equipo

Este manual es operativo. La evolucion recomendada es implementar:

1. cola local (outbox) para transacciones,
2. sincronizacion automatica con idempotencia,
3. panel de pendientes por sincronizar.

Con eso, el modo sin internet pasa de "limitado" a "resiliente".
