from flask import Blueprint, render_template

prep_bp = Blueprint('prep', __name__)


@prep_bp.route('/prep')
def prep():
    return render_template('prep.html')
