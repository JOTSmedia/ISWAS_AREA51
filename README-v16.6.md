# v16.6

Restores sequential loader progress: every integer from 1 through 100 gets its own animation frame update, even after a stall or cached load. Holds below 100 until gallery readiness (or the existing timeout), then shows completion and fades. Retains v16.5 rendering optimizations. Progress is a staged loading animation, not a byte-transfer percentage. Automated checks cover cached load, delayed readiness, a stalled main thread and timeout.
