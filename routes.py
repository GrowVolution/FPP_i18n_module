
from flaskpp import Module
from flaskpp.app.utils.auto_nav import autonav_route


def init_routes(mod: Module):
    @autonav_route(mod, "/", mod.t("MANAGE"))
    def index():
        return mod.render_template("index.html")
