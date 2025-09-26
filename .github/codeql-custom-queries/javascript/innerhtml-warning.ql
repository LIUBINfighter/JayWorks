import javascript
import semmle.javascript.security.dataflow.CodeInjectionQuery

from PropertyAccess pa, MemberAccess ma
where
  pa.getTarget().getType().hasName("Element") and
  ma = pa and
  ma.getMemberName() in ["innerHTML", "outerHTML"]
select pa, "Potential unsafe HTML assignment: $@", pa.getMemberName()
