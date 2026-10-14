# Git etiquette

## The rule

**Commit after each step succeeds.** A step is done when:
1. The browser renders the new behavior correctly.
2. `npm run test` passes (or the relevant test for that step).
3. No red errors in the browser console.

If any of those fail, fix first, commit second. Never commit broken state.

## Commit shape

```
Step NN: <what changed in one line>
```

Examples:
- `Step 11a: DriveBase blocks (straight, turn, reset, use_gyro)`
- `Step 13: comment blocks + inline comment attachment`
- `Step 14: hardware setup blocks (PrimeHub, Motor, DriveBase)`

No periods. No `feat:` prefix. Plain English.

## When to commit mid-step

Sometimes a step is big and you want a checkpoint. Commit if **all** of these are true:

- The code compiles (`npm run build` doesn't error on your file)
- Existing tests still pass
- The app doesn't crash on load
- The new feature is **partially** working (not half-broken)

Message format for checkpoints:
```
Step NN (WIP): <what works so far>
```

## When NOT to commit

- Copilot just wrote code and you haven't seen it render yet
- Tests fail
- The browser console has errors
- You're about to try a risky change (commit the *current* good state first, then experiment)

## Recovering from a bad step

If a step goes wrong and you want to undo:

```
git checkout .
git clean -fd      # only if new files were created and you want them gone
```

Then paste the step prompt again, or adjust it and retry.

To see the trail of steps:
```
git log --oneline
```

## Branches

For v1, everything goes on `main`. If you want to try a risky idea (custom field renderer, theme overhaul), branch first:

```
git checkout -b try-custom-chips
# ... experiment ...
git checkout main     # if it didn't work
git merge try-custom-chips   # if it did
```

## Before pushing

```
git status          # see what's staged
git diff            # see what changed
git log --oneline   # sanity-check the history
```

Then `git push`.