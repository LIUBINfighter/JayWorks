import javascript

from CallExpr call, MemberAccess ma
where
  ma = call.getCallee().(MemberAccess) and
  ma.getMemberName() in ["log", "info", "debug"]
select call, "Avoid non-error console logging in plugin code: %s", ma.getMemberName()
