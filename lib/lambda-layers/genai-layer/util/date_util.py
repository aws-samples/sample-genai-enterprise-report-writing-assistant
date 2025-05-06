"""
Date utility.
"""
from datetime import date

def get_current_month_year() -> str:
    """
    Get the current month and year in full month name and digital year format.

    Args: None

    Returns: current full month name and digital year format.
    """
    return date.today().strftime("%B %Y")

