import importlib.util
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('runner', Path(__file__).parents[1] / 'challenges/runner.py')
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
VALID = {'mode': 'cache', 'challenge': 'ghost-in-the-cache', 'principal': 'a' * 64, 'flag': 'CTF{test}'}


class Runner(unittest.TestCase):
    def setUp(self):
        runner.instances.clear()

    def test_untrusted_types_and_modes_rejected_before_docker(self):
        with patch.object(runner, 'docker') as docker:
            for data in [[], None, {}, {**VALID, 'principal': []}, {**VALID, 'flag': 42}, {**VALID, 'challenge': 'other'}, {**VALID, 'flag': 'CTF{bad\nvalue}'}]:
                with self.assertRaises(ValueError):
                    runner.launch(data)
            docker.assert_not_called()

    def test_start_failure_cleans_orphan_network(self):
        def docker(*args):
            if args[0] == 'run':
                raise subprocess.CalledProcessError(1, 'docker run')
            return ''
        with patch.object(runner, 'docker', side_effect=docker) as call:
            with self.assertRaises(subprocess.CalledProcessError):
                runner.launch(VALID)
            self.assertEqual(call.call_args.args[:2], ('network', 'rm'))
            self.assertFalse(runner.instances)

    def test_reuse_capacity_and_expiry(self):
        with patch.object(runner, 'docker', return_value='127.0.0.1:12345'), patch.object(runner, 'MAX_LABS', 1):
            code, lab = runner.launch(VALID)
            self.assertEqual(code, 201)
            self.assertNotIn('name', lab)
            self.assertEqual(runner.launch(VALID), (200, lab))
            self.assertEqual(runner.launch({**VALID, 'principal': 'b' * 64})[0], 503)
            runner.reap_once(lab['expires'])
            self.assertFalse(runner.instances)

    def test_recovery_is_scoped_to_runner(self):
        with patch.object(runner, 'docker', return_value='') as call:
            runner.recover()
            self.assertTrue(all(f'label=cipherground.runner={runner.RUNNER_ID}' in c.args for c in call.call_args_list))
