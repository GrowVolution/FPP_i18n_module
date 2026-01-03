from flaskpp import Module, FlaskPP
from flaskpp.utils import enabled
from flaskpp.exceptions import ModuleError

module = Module(
    __file__,
    __name__,
    [
        "sqlalchemy",
		"socket",
		"babel"
    ],
    False
)


@module.on_enable
def enable(app: FlaskPP):
    if not enabled("FPP_PROCESSING"):
        raise ModuleError(f"Module '{module.module_name}' requires FPP_PROCESSING.")

    if not enabled("AUTOGENERATE_TAILWIND_CSS"):
        raise ModuleError(f"Module '{module.module_name}' requires AUTOGENERATE_TAILWIND_CSS.")

    if not enabled("FRONTEND_ENGINE"):
        raise ModuleError(f"Module '{module.module_name}' requires FRONTEND_ENGINE.")

    from .data.noinit_translations import setup_db
    with app.app_context():
        setup_db(module)
        app.extensions['babel'].babel.register_module(module)
    module.init_routes()

    from .handling.socket_events import register_events
    register_events(module)
