"""Python Unit Tests for Undercover Chameleon Game Logic."""

import subprocess
import os


def test_node_game_logic_suite():
    """Executes the core game logic test suite via Node.js."""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_file = os.path.join(base_dir, "tests", "test_game_logic.js")
    
    result = subprocess.run(["node", test_file], capture_output=True, text=True)
    assert result.returncode == 0, f"Node test suite failed: {result.stderr}"
    assert "ALL 5 UNIT TESTS PASSED CLEANLY" in result.stdout
