#### Data Types

Java organizes all data types into two main categories:
 * Primitive Data Types
 * Non-Primitive (Reference) Types


----


<details><summary>⭐ String Pool: == vs equals(), new String(), intern(), StringBuilder.equals()</summary>

Literals and compile-time constants share one object in the String Constant Pool (SCP). `new String()` and runtime concatenation always create a new heap object. `intern()` returns the pool object. `StringBuilder` and `StringBuffer` do not override `equals()`, so it compares references.

Use `show()` to see the truth: **same identityHashCode = same object**, which is exactly what `==` checks.

```java runnable
public class Main {

    // Legend used in the comments below (the real numbers change on every run):
    // H1 = SCP object "Java",  H2, H3, H4... = other objects.  Same H = same object = == is true

    public static void main(String[] args) {

        // ---------- 1. Literal vs new String() ----------
        String literalJava1 = "Java";
        String literalJava2 = "Java";
        String heapJava1 = new String("Java");
        String heapJava2 = new String("Java");

        show("literalJava1", literalJava1);  // H1 -> SCP object
        show("literalJava2", literalJava2);  // H1 -> same SCP object, reused
        show("heapJava1", heapJava1);        // H2 -> new heap object
        show("heapJava2", heapJava2);        // H3 -> another new heap object

        System.out.println(literalJava1 == literalJava2);    // true  -> H1 == H1
        System.out.println(literalJava1 == heapJava1);       // false -> H1 vs H2 (pool vs heap)
        System.out.println(heapJava1 == heapJava2);          // false -> H2 vs H3 (every new String() is a separate object)
        System.out.println(literalJava1.equals(heapJava1));  // true  -> equals() compares content, not hash
        System.out.println(heapJava1.equals(heapJava2));     // true  -> same content

        // ---------- 2. intern() ----------
        String internedJava = heapJava2.intern();

        show("heapJava1.intern()", heapJava1.intern());      // H1 -> "Java" already in SCP, so the pool object is returned
        show("internedJava", internedJava);                  // H1 -> same pool object
        show("heapJava2 (after intern)", heapJava2);         // H3 -> unchanged, intern() does not modify the original reference

        System.out.println(internedJava == literalJava1);    // true  -> H1 == H1
        System.out.println(heapJava2 == internedJava);       // false -> H3 vs H1

        // ---------- 3. Concatenation: compile time vs runtime ----------
        String nonFinalPrefix = "Ja";                  // not final -> compiler cannot fold it
        String nonFinalSuffix = "va";
        final String finalPrefix = "Ja";               // final + literal = compile-time constant
        final String finalSuffix = "va";
        final String finalFromNew = new String("Ja");  // final, but value comes from new -> NOT a constant

        // Compile-time constants: folded into the literal "Java" -> SCP
        String literalPlusLiteral = "Ja" + "va";
        String finalPlusFinal = finalPrefix + finalSuffix;
        String finalPlusLiteral = finalPrefix + "va";
        String literalPlusFinal = "Ja" + finalSuffix;

        show("literalPlusLiteral", literalPlusLiteral);  // H1 -> folded at compile time
        show("finalPlusFinal", finalPlusFinal);          // H1 -> both are constants, folded
        show("finalPlusLiteral", finalPlusLiteral);      // H1 -> constant + literal, folded
        show("literalPlusFinal", literalPlusFinal);      // H1 -> literal + constant, folded

        // Runtime concatenation: new heap object every time
        String nonFinalPlusNonFinal = nonFinalPrefix + nonFinalSuffix;
        String nonFinalPlusLiteral = nonFinalPrefix + "va";
        String literalPlusNonFinal = "Ja" + nonFinalSuffix;
        String finalPlusNonFinal = finalPrefix + nonFinalSuffix;
        String finalFromNewPlusLiteral = finalFromNew + "va";

        show("nonFinalPlusNonFinal", nonFinalPlusNonFinal);        // H4 -> runtime, new heap object
        show("nonFinalPlusLiteral", nonFinalPlusLiteral);          // H5 -> one non-final operand makes it runtime
        show("literalPlusNonFinal", literalPlusNonFinal);          // H6 -> one non-final operand makes it runtime
        show("finalPlusNonFinal", finalPlusNonFinal);              // H7 -> constant + non-final is still runtime
        show("finalFromNewPlusLiteral", finalFromNewPlusLiteral);  // H8 -> final alone is not enough, it must be a constant
        show("nonFinalPlusNonFinal.intern()", nonFinalPlusNonFinal.intern()); // H1 -> intern() brings it back to the pool object

        System.out.println(literalPlusLiteral == literalJava1);         // true  -> H1 == H1
        System.out.println(finalPlusFinal == literalJava1);             // true  -> H1 == H1
        System.out.println(finalPlusLiteral == literalJava1);           // true  -> H1 == H1
        System.out.println(literalPlusFinal == literalJava1);           // true  -> H1 == H1
        System.out.println(nonFinalPlusNonFinal == literalJava1);       // false -> H4 vs H1
        System.out.println(nonFinalPlusLiteral == literalJava1);        // false -> H5 vs H1
        System.out.println(literalPlusNonFinal == literalJava1);        // false -> H6 vs H1
        System.out.println(finalPlusNonFinal == literalJava1);          // false -> H7 vs H1
        System.out.println(finalFromNewPlusLiteral == literalJava1);    // false -> H8 vs H1
        System.out.println(nonFinalPlusNonFinal.equals(literalJava1));  // true  -> content is the same
        System.out.println(nonFinalPlusNonFinal.intern() == literalJava1); // true -> H1 == H1

        // ---------- 4. String created from char[] (no literal involved) ----------
        char[] poolXChars = {'P', 'o', 'o', 'l', 'X'};
        String heapFromCharArray = new String(poolXChars);          // heap object, not created from any literal
        String internedFromCharArray = heapFromCharArray.intern();  // "PoolX" is not in SCP yet
        String literalPoolX = "PoolX";

        show("heapFromCharArray", heapFromCharArray);          // H9 -> heap object
        show("internedFromCharArray", internedFromCharArray);  // H9 -> proof: intern() added THIS heap object to the pool (Java 7+) and returned it
        show("literalPoolX", literalPoolX);                    // H9 -> literal now finds that pool entry (HotSpot resolves a literal when the line first runs)

        System.out.println(internedFromCharArray == heapFromCharArray); // true -> nothing matching was in SCP before (if a "PoolX" literal had existed, this would be false)
        System.out.println(literalPoolX == heapFromCharArray);          // true -> H9 == H9

        // String charString = new String('Y');   // COMPILE ERROR: constructor String(char) is undefined, use String.valueOf('Y') or "Y"

        // ---------- 5. StringBuilder and StringBuffer ----------
        StringBuilder builderJava1 = new StringBuilder("Java");
        StringBuilder builderJava2 = new StringBuilder("Java");
        StringBuffer bufferJava1 = new StringBuffer("Java");
        StringBuffer bufferJava2 = new StringBuffer("Java");

        show("builderJava1", builderJava1);  // H10 -> own object
        show("builderJava2", builderJava2);  // H11 -> different object, same content
        show("bufferJava1", bufferJava1);    // H12 -> own object
        show("bufferJava2", bufferJava2);    // H13 -> different object, same content

        System.out.println(builderJava1.equals(builderJava2));                       // false -> equals() not overridden, compares references (H10 vs H11)
        System.out.println(bufferJava1.equals(bufferJava2));                         // false -> StringBuffer behaves the same (H12 vs H13)
        System.out.println(literalJava1.equals(builderJava1));                       // false -> String.equals() accepts only a String
        System.out.println(builderJava1.toString().equals(builderJava2.toString())); // true  -> convert to String, then compare content
        System.out.println(literalJava1.contentEquals(builderJava1));                // true  -> contentEquals() compares with any CharSequence
        System.out.println(literalJava1.contentEquals(bufferJava1));                 // true  -> works for StringBuffer too
        System.out.println(builderJava1.compareTo(builderJava2) == 0);               // true  -> compareTo() compares content (Java 11+)
    }

    // Prints the variable name, its value and its identityHashCode (same number = same object)
    private static void show(String name, Object value) {
        System.out.printf("%-32s | value: %-8s | identityHashCode: %d%n",
                name, value, System.identityHashCode(value));
    }
}
```

- Live visual flow: https://interviewdepth.com/java-works

</details>