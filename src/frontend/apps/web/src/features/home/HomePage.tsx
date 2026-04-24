import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { AppNavIcon, appNavGroups, isNavItemVisible } from '../../app/navigationConfig';
import { CrossModuleLinks } from '../../shared/components/CrossModuleLinks';

function nowLabel() {
  return new Date().toLocaleDateString('es-HN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function HomePage() {
  const { user, hasPermission, hasAnyPermission } = useAuth();
  const has = (p: string) => hasPermission(p);
  const hasAny = (a: string[]) => hasAnyPermission(a);

  const areas = appNavGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => isNavItemVisible(i, has, hasAny)),
    }))
    .filter((g) => g.id !== 'inicio' && g.items.length > 0);

  return (
    <div className="pro-page pro-home">
      <header className="pro-home__hero">
        <div>
          <p className="pro-home__greet">Hola, {user?.fullName ?? 'usuario'}</p>
          <p className="pro-home__lead">Toque o elija abajo, o en el menu a la izquierda. Cada tarjeta dice con claridad para que sirve.</p>
        </div>
        <div className="pro-home__date" title="Fecha de tu equipo">
          {nowLabel()}
        </div>
      </header>

      <div className="pro-home__quick" aria-label="Botones de navegacion">
        <CrossModuleLinks
          heading="Botones principales"
          items={[
            { to: '/ordenes', label: 'Listado de ordenes', show: hasAny(['ORDEN.READ', 'ORDEN.CREATE']) },
            { to: '/orders', label: 'Nueva orden a cobrar', show: has('ORDEN.CREATE') },
            { to: '/patients', label: 'Pacientes', show: has('PACIENTE.READ') },
            { to: '/lab/resultados', label: 'Resultados', show: has('RESULTADOS.VALIDAR') },
            { to: '/caja/cierre', label: 'Caja', show: has('CAJA.CERRAR') },
            { to: '/sar', label: 'SAR e ISV', show: has('FISCAL.READ') },
          ]}
        />
      </div>

      {areas.length === 0 ? (
        <p className="pro-muted pro-home__empty">No hay secciones visibles con su usuario. Pida al responsable del laboratorio que le asigne permisos.</p>
      ) : (
        <div className="pro-home__bays" role="list">
          {areas.map((g) => (
            <section key={g.id} className="pro-bay" aria-label={g.label} role="listitem">
              <h3 className="pro-bay__title">{g.label}</h3>
              {g.intro && <p className="pro-bay__intro">{g.intro}</p>}
              <div className="pro-bay__tiles" role="list">
                {g.items.map((x) => (
                  <Link key={x.to} to={x.to} className="pro-tile">
                    <span className="pro-tile__ico">
                      <AppNavIcon name={x.icon} />
                    </span>
                    <span className="pro-tile__body">
                      <span className="pro-tile__h">{x.label}</span>
                      <span className="pro-tile__desc">{x.hint}</span>
                    </span>
                    <span className="pro-tile__go" aria-hidden>
                      Ir
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="pro-home__legal">Solo se muestran accesos permitidos por su puesto. Si falta alguno, es decision del administrador.</p>
    </div>
  );
}
