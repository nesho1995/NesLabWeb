export type CrossModuleLink = { to: string; label: string; show: boolean };

type Props = {
  /** Titulo encima de los botones de navegacion */
  heading?: string;
  items: CrossModuleLink[];
  marginTop?: number;
};

/** Ayudas de navegacion ocultas por decision UX. */
export function CrossModuleLinks(_: Props) {
  // UX solicitado: ocultar ayudas de navegacion entre modulos.
  // Se mantiene el componente para no tocar cada pantalla; aqui se puede reactivar despues.
  return null;
}
