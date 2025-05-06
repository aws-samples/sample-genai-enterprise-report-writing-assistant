"""
Boolean utility.
"""

VALID_TRUE_VALUES = ["true", "t", "1"]

def is_true(value: str) -> bool:
    """
    Given text string, return true/false of the text string.

    Args:
        value: the text to check for true/false.

    Returns:
        true/false value.

    """
    return value is not None and value.lower() in VALID_TRUE_VALUES
