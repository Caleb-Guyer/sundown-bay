"""Limit the entire headless Chrome process tree, including its software GPU."""
import os
from pathlib import Path
import shutil
import subprocess
import sys


def two_cores():
    cores = {}
    for cpu in sorted(os.sched_getaffinity(0)):
        topology = Path(f"/sys/devices/system/cpu/cpu{cpu}/topology")
        key = tuple((topology / name).read_text().strip() for name in ("physical_package_id", "core_id"))
        cores.setdefault(key, cpu)
    assert len(cores) >= 2, "Two separate cores are required"
    return ",".join(str(cpu) for cpu in list(cores.values())[:2])


if __name__ == "__main__":
    assert os.environ.get("GITHUB_ACTIONS") == "true" and sys.platform == "linux"
    if sys.argv[1] == "--inside":
        group = Path("/sys/fs/cgroup") / Path("/proc/self/cgroup").read_text().strip().split("::")[-1].lstrip("/")
        memory = int((group / "memory.max").read_text())
        swap = int((group / "memory.swap.max").read_text())
        cpus = os.sched_getaffinity(0)
        print(f"PERF proxy limits: CPUs {sorted(cpus)}, RAM {memory} bytes, swap {swap} bytes", flush=True)
        assert len(cpus) == 2 and memory == 4 * 1024**3 and swap == 0
        try:
            subprocess.run(sys.argv[2:], check=True)
        finally:
            print("PERF proxy peak bytes", (group / "memory.peak").read_text().strip(), flush=True)
    else:
        view, build = sys.argv[1:]
        assert view in ("street", "overhead") and build in ("public", "candidate")
        command = [
            "sudo", "systemd-run", "--quiet", "--wait", "--pipe", "--collect",
            f"--uid={os.getuid()}", f"--gid={os.getgid()}", f"--working-directory={Path.cwd()}",
            f"--property=AllowedCPUs={two_cores()}", "--property=MemoryMax=4G", "--property=MemorySwapMax=0",
            "--setenv=GITHUB_ACTIONS=true", f"--setenv=HOME={os.environ['HOME']}",
            f"--setenv=RUNNER_TEMP={os.environ['RUNNER_TEMP']}", sys.executable, __file__, "--inside",
            shutil.which("node"), ".github/playtests/live.cjs", view, "--chromebook",
        ]
        if build == "public":
            command.append("--baseline")
        subprocess.run(command, check=True)
