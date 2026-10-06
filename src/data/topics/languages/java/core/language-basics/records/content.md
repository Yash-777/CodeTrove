# Records

Java records are concise, shallowly immutable data carriers. The compiler derives a canonical constructor, accessors, `equals`, `hashCode`, and `toString` from the record components. A record is implicitly final and cannot extend another class.

This navigation entry reuses the existing detailed guide rather than maintaining a duplicate:

[Open the Java Records guide](/content/java/records)

Choose a normal class when the type needs mutable state, inheritance, or behavior beyond a value-oriented data carrier. Mutable objects inside record components are not made immutable automatically.
