# Top Interview Programming Questions

Java programs grouped by concept, ordered by how often they are asked. ⭐ = Mostly asked / must practice. Every program is runnable, shows several approaches in one class (one method per approach), and the expected output is written as a comment next to each line.

---

<details open><summary>Concept 1: Core Java Tricky Output Programs</summary>

<details><summary>⭐ Is Java pass by value or pass by reference?</summary>

Java is always pass by value. For objects, the value of the reference is copied. Changing the object through the copy is visible to the caller, but pointing the copy to a new object is not.

```java runnable
class Student {
    int id;
}

public class Main {
    public static void main(String[] args) {
        Student s1 = new Student();
        s1.id = 1;
        reassign(s1);
        System.out.println("After reassign: " + s1.id);   // 1 -> caller's reference was not changed

        Student s2 = new Student();
        s2.id = 1;
        mutate(s2);
        System.out.println("After mutate: " + s2.id);     // 5 -> same object was changed
    }

    // Approach 1: reassign the parameter (caller is not affected)
    static void reassign(Student a) {
        a = new Student();
        a.id = 5;
    }

    // Approach 2: mutate the object (caller sees the change)
    static void mutate(Student a) {
        a.id = 5;
    }
}
```

</details>

<details><summary>⭐ Method overloading: which method is called for number(5), numberVarArgs(5), nullable(null)?</summary>

Java picks the method in phases: exact/widening first, then boxing, then varargs last. For `null`, the most specific type wins, and unrelated types give a compile error.

```java runnable
public class Main {
    static void number(int i)   { System.out.println("int"); }
    static void number(short i) { System.out.println("short"); }
    static void number(long i)  { System.out.println("long"); }

    static void numberVarArgs(int... i) { System.out.println("int var args"); }
    static void numberVarArgs(long i)   { System.out.println("long"); }

    static void nullable(String s)  { System.out.println("String"); }
    static void nullable(Number n)  { System.out.println("Number"); }
    static void nullable(Integer i) { System.out.println("Integer"); }
    static void nullable(Long... l) { System.out.println("Long var args"); }
    static void nullable(Object o)  { System.out.println("Object"); }

    public static void main(String[] args) {
        number(5);                  // int  -> 5 is an int literal, exact match wins
        numberVarArgs(5);           // long -> phase 1: widening int -> long beats varargs (varargs is the last resort)

        // nullable(null);          // COMPILE ERROR: reference to nullable is ambiguous
                                    // null fits String, Integer and Long[] (varargs), they are unrelated, so none is the most specific

        nullable((String) null);    // String  -> fix with a cast: exact match
        nullable((Integer) null);   // Integer -> exact match, more specific than Number and Object
        nullable((Long) null);      // Number  -> no Long overload, so Long is passed as its parent Number (subtyping); Number is more specific than Object
        // nullable((Object) null); // Object  -> exact match (works if you uncomment it)
    }
}
```

</details>

<details><summary>⭐ What is the output of 10 + 20 + "Java" and "Java" + 10 + 20?</summary>

`+` works left to right. `int + int` adds. Once a `String` is involved, everything after it is concatenated.

```java runnable
public class Main {
    public static void main(String[] args) {
        System.out.println(10 + 20 + "Java");       // 30Java   -> add first, then concatenate
        System.out.println("Java" + 10 + 20);       // Java1020 -> concatenate every time
        System.out.println("Java" + (10 + 20));     // Java30   -> brackets force addition
        System.out.println(10 + "Java" + 20);       // 10Java20 -> String appears after the first operand
        System.out.println('a' + 'b' + "Java");     // 195Java  -> char + char = int (97 + 98), then concatenate
        System.out.println("Java" + 'a' + 'b');     // Javaab   -> chars are appended as characters
    }
}
```

</details>

<details><summary>⭐ Integer cache: why is 127 == 127 true but 128 == 128 false?</summary>

`Integer.valueOf()` (used by autoboxing) caches objects from -128 to 127. Outside that range each boxing creates a new object, so `==` compares different references. Always use `equals()` for wrapper objects.

```java runnable
public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;

        System.out.println(a == b);                                       // true  -> cached, same object
        System.out.println(c == d);                                       // false -> not cached, different objects
        System.out.println(c.equals(d));                                  // true  -> Approach 1: equals() compares values
        System.out.println(c.intValue() == d.intValue());                 // true  -> Approach 2: unbox to int, compares values
        System.out.println(Integer.valueOf(127) == Integer.valueOf(127)); // true  -> both return the cached object
        System.out.println(c == 128);                                     // true  -> c is unboxed because the other side is an int
    }
}
```

<details><summary>Java Source - Integer.valueOf()</summary>

Check it live here: https://interviewdepth.com/java-works

```java
/*
 * Cache to support the object identity semantics of autoboxing
 * for values between -128 and 127 (inclusive) as required by JLS.
 */
@jdk.internal.ValueBased
public final class Integer extends Number
        implements Comparable<Integer>, Constable, ConstantDesc {

    /**
     * Returns an {@code Integer} instance representing the specified
     * {@code int} value.  If a new {@code Integer} instance is not
     * required, this method should generally be used in preference to
     * the constructor {@link #Integer(int)}, as this method is likely
     * to yield significantly better space and time performance by
     * caching frequently requested values.
     *
     * This method will always cache values in the range -128 to 127,
     * inclusive, and may cache other values outside of this range.
     *
     * @since  1.5
     */
    @jdk.internal.vm.annotation.IntrinsicCandidate
    public static Integer valueOf(int i) {
        if (i >= IntegerCache.low && i <= IntegerCache.high)
            return IntegerCache.cache[i + (-IntegerCache.low)];
        return new Integer(i);
    }
}
```

</details>

</details>

<details><summary>⭐ String Pool: == vs equals(), new String(), intern(), StringBuilder.equals()</summary>

Literals share one object in the String Constant Pool. `new String()` always creates a new heap object. `intern()` returns the pool object. `StringBuilder` does not override `equals()`, so it compares references.

```java runnable
public class Main {
    public static void main(String[] args) {
        String s1 = "Java";
        String s2 = "Java";
        String s3 = new String("Java");

        System.out.println(s1 == s2);                  // true  -> same pool object
        System.out.println(s1 == s3);                  // false -> pool vs heap
        System.out.println(s1.equals(s3));             // true  -> content comparison
        System.out.println(s3.intern() == s1);         // true  -> intern() gives the pool object
        System.out.println("Ja" + "va" == s1);         // true  -> compile-time constant, folded into "Java"

        String part = "Ja";
        System.out.println((part + "va") == s1);       // false -> runtime concatenation = new object

        StringBuilder sb1 = new StringBuilder("Java");
        StringBuilder sb2 = new StringBuilder("Java");
        System.out.println(sb1.equals(sb2));           // false -> equals() not overridden, reference comparison
        System.out.println("Java".contentEquals(sb1)); // true  -> content comparison
    }
}
```

Live visual flow: https://interviewdepth.com/java-works

</details>

<details><summary>⭐ try / catch / finally: what is the output? What does finally return?</summary>

`finally` always runs, even when an exception is thrown. In nested blocks the inner `finally` runs before the outer `catch`. A `return` inside `finally` overrides the earlier return.

```java runnable
public class Main {
    public static void main(String[] args) {
        nested();                                                  // Inner Finally, Handled, Outer Finally (one per line)
        System.out.println("returns: " + returnValue());           // returns: 1 -> value is saved before finally runs
        System.out.println("returns: " + finallyOverrides());      // returns: 2 -> return inside finally wins
    }

    // Approach 1: nested try
    static void nested() {
        try {
            try {
                int x = 10 / 0;                                    // throws ArithmeticException
            } finally {
                System.out.println("Inner Finally");               // runs 1st -> before the exception reaches the outer catch
            }
        } catch (ArithmeticException e) {
            System.out.println("Handled");                         // runs 2nd
        } finally {
            System.out.println("Outer Finally");                   // runs 3rd
        }
    }

    // Approach 2: return value is saved before finally runs
    static int returnValue() {
        int x = 1;
        try {
            return x;                                              // value 1 is saved here
        } finally {
            x = 2;                                                 // changes the variable, not the saved value
        }
    }

    // Approach 3: return inside finally wins (avoid this in real code)
    static int finallyOverrides() {
        try {
            return 1;
        } finally {
            return 2;
        }
    }
}
```

</details>

<details><summary>Unicode equality: "Hello World" vs "Hello&nbsp;World" (non-breaking space)</summary>

Two strings can look the same but contain different space characters. `equals()` compares the real characters, so normalize before comparing.

```java runnable
import java.text.Normalizer;

public class Main {
    public static void main(String[] args) {
        String normal = "Hello World";             // normal space   (U+0020)
        String nbsp = "Hello\u00A0World";          // non-breaking space (U+00A0)

        System.out.println(normal.equals(nbsp));                                    // false -> different space characters
        System.out.println(normal.length() + " " + nbsp.length());                  // 11 11 -> same length, so length cannot tell
        System.out.println((int) nbsp.charAt(5));                                   // 160   -> code of the non-breaking space

        System.out.println(nbsp.replace('\u00A0', ' ').equals(normal));             // true  -> Approach 1: replace the exact character
        System.out.println(nbsp.replaceAll("\\p{Z}", " ").equals(normal));          // true  -> Approach 2: \p{Z} matches any Unicode space separator
        System.out.println(nbsp.replaceAll("(?U)\\s", " ").equals(normal));         // true  -> Approach 3: (?U) makes \s Unicode aware
        System.out.println(Normalizer.normalize(nbsp, Normalizer.Form.NFKC).equals(normal)); // true -> Approach 4: NFKC maps U+00A0 to a normal space

        System.out.println(nbsp.replaceAll("\\s", " ").equals(normal));             // false -> plain \s does NOT match U+00A0
        System.out.println(Character.isWhitespace('\u00A0'));                       // false -> non-breaking space is excluded
        System.out.println(Character.isSpaceChar('\u00A0'));                        // true  -> but it is a space separator
    }
}
```

</details>

</details>

---

<details open><summary>Concept 2: String Programs</summary>

<details><summary>⭐ Reverse a string</summary>

Four common ways: `StringBuilder.reverse()`, swapping characters in an array, recursion, and streams.

```java runnable
public class Main {
    public static void main(String[] args) {
        String s = "interview";
        System.out.println("StringBuilder: " + byStringBuilder(s));   // weivretni -> easiest
        System.out.println("Char array   : " + byCharArray(s));       // weivretni -> swap from both ends
        System.out.println("Recursion    : " + byRecursion(s));       // weivretni -> last char + reverse of the rest
        System.out.println("Stream       : " + byStream(s));          // weivretni -> reduce, prepending each char
    }

    static String byStringBuilder(String s) {
        return new StringBuilder(s).reverse().toString();
    }

    static String byCharArray(String s) {
        char[] c = s.toCharArray();
        for (int i = 0, j = c.length - 1; i < j; i++, j--) {
            char t = c[i];
            c[i] = c[j];
            c[j] = t;
        }
        return new String(c);
    }

    static String byRecursion(String s) {
        if (s.isEmpty()) return s;
        return byRecursion(s.substring(1)) + s.charAt(0);
    }

    static String byStream(String s) {
        return s.chars()
                .mapToObj(c -> String.valueOf((char) c))
                .reduce("", (a, b) -> b + a);
    }
}
```

</details>

<details><summary>⭐ Check if a string is a palindrome</summary>

Compare with the reversed string, or compare characters from both ends (two pointers, no extra memory).

```java runnable
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        for (String w : new String[]{"madam", "hello"}) {
            System.out.println(w + " -> " + byReverse(w) + " " + twoPointers(w) + " " + byStream(w));
            // madam -> true true true     (byReverse, twoPointers, byStream all agree)
            // hello -> false false false
        }
    }

    static boolean byReverse(String s) {
        return s.equals(new StringBuilder(s).reverse().toString());
    }

    static boolean twoPointers(String s) {
        int i = 0, j = s.length() - 1;
        while (i < j) {
            if (s.charAt(i++) != s.charAt(j--)) return false;
        }
        return true;
    }

    static boolean byStream(String s) {
        return IntStream.range(0, s.length() / 2)
                .allMatch(i -> s.charAt(i) == s.charAt(s.length() - 1 - i));
    }
}
```

</details>

<details><summary>⭐ Check if two strings are anagrams</summary>

Same letters with the same counts. Sort both, or count letters with an array or a map.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[][] pairs = {{"listen", "silent"}, {"hello", "world"}};
        for (String[] p : pairs) {
            System.out.println(p[0] + "/" + p[1] + " -> "
                    + bySorting(p[0], p[1]) + " "
                    + byCountArray(p[0], p[1]) + " "
                    + byMap(p[0], p[1]));
            // listen/silent -> true true true     (bySorting, byCountArray, byMap)
            // hello/world -> false false false
        }
    }

    static boolean bySorting(String a, String b) {
        char[] x = a.toCharArray(), y = b.toCharArray();
        Arrays.sort(x);
        Arrays.sort(y);
        return Arrays.equals(x, y);
    }

    static boolean byCountArray(String a, String b) {
        if (a.length() != b.length()) return false;
        int[] count = new int[26];
        for (int i = 0; i < a.length(); i++) {
            count[a.charAt(i) - 'a']++;
            count[b.charAt(i) - 'a']--;
        }
        for (int c : count) if (c != 0) return false;
        return true;
    }

    static boolean byMap(String a, String b) {
        Map<Character, Integer> map = new HashMap<>();
        for (char c : a.toCharArray()) map.merge(c, 1, Integer::sum);
        for (char c : b.toCharArray()) map.merge(c, -1, Integer::sum);
        return map.values().stream().allMatch(v -> v == 0);
    }
}
```

</details>

<details><summary>⭐ Find the first non-repeated character in a string</summary>

Count first, then pick the first character with count 1. `indexOf == lastIndexOf` is the shortest way.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String s = "swiss";
        System.out.println("LinkedHashMap: " + byMap(s));       // w -> s=3, w=1, i=1, first with count 1 is w
        System.out.println("indexOf      : " + byIndexOf(s));   // w -> first index equals last index
        System.out.println("Stream       : " + byStream(s));    // w -> same idea with a stream
    }

    static Character byMap(String s) {
        Map<Character, Integer> count = new LinkedHashMap<>();
        for (char c : s.toCharArray()) count.merge(c, 1, Integer::sum);
        for (Map.Entry<Character, Integer> e : count.entrySet()) {
            if (e.getValue() == 1) return e.getKey();
        }
        return null;
    }

    static Character byIndexOf(String s) {
        for (char c : s.toCharArray()) {
            if (s.indexOf(c) == s.lastIndexOf(c)) return c;
        }
        return null;
    }

    static Character byStream(String s) {
        return s.chars()
                .mapToObj(c -> (char) c)
                .filter(c -> s.indexOf(c) == s.lastIndexOf(c))
                .findFirst()
                .orElse(null);
    }
}
```

</details>

<details><summary>⭐ Find duplicate characters and their count in a string</summary>

Use a map to count each character, then keep only the ones with count above 1. Or use a `Set` to collect characters seen twice.

```java runnable
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        String s = "programming";
        System.out.println("Map loop : " + byMap(s));       // {r=2, g=2, m=2} -> count, then drop counts below 2
        System.out.println("Stream   : " + byStream(s));    // {r=2, g=2, m=2} -> same with groupingBy
        System.out.println("Set only : " + bySet(s));       // [r, m, g]       -> order of the 2nd occurrence
    }

    static Map<Character, Integer> byMap(String s) {
        Map<Character, Integer> freq = new LinkedHashMap<>();
        for (char c : s.toCharArray()) freq.merge(c, 1, Integer::sum);
        freq.values().removeIf(v -> v < 2);
        return freq;
    }

    static Map<Character, Long> byStream(String s) {
        Map<Character, Long> freq = s.chars()
                .mapToObj(c -> (char) c)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
        freq.values().removeIf(v -> v < 2);
        return freq;
    }

    static Set<Character> bySet(String s) {
        Set<Character> seen = new HashSet<>();
        Set<Character> duplicates = new LinkedHashSet<>();
        for (char c : s.toCharArray()) {
            if (!seen.add(c)) duplicates.add(c);
        }
        return duplicates;
    }
}
```

</details>

<details><summary>⭐ Find the most repeated character(s) in a string</summary>

Count every character, find the highest count, then print every character that has it (there can be a tie).

```java runnable
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        String str = "interview";
        System.out.println("Map + Collections.max: " + byMap(str));      // {i=2, e=2} -> tie, both appear twice
        System.out.println("Stream               : " + byStream(str));   // {i=2, e=2} -> same result with groupingBy

        for (Map.Entry<Character, Integer> entry : byMap(str).entrySet()) {
            System.out.format("Char ['%s'] repeated %d times%n", entry.getKey(), entry.getValue());
            // Char ['i'] repeated 2 times
            // Char ['e'] repeated 2 times
        }
    }

    static Map<Character, Integer> byMap(String str) {
        Map<Character, Integer> map = new LinkedHashMap<>();
        for (char c : str.toCharArray()) {
            map.merge(c, 1, (prevValue, newValue) -> prevValue + newValue);
        }
        int maxValueInMap = Collections.max(map.values());
        map.values().removeIf(v -> v != maxValueInMap);
        return map;
    }

    static Map<Character, Long> byStream(String str) {
        Map<Character, Long> freq = str.chars()
                .mapToObj(c -> (char) c)
                .collect(Collectors.groupingBy(Function.identity(), LinkedHashMap::new, Collectors.counting()));
        long max = Collections.max(freq.values());
        freq.values().removeIf(v -> v != max);
        return freq;
    }
}
```

</details>

<details><summary>Remove a character from a string</summary>

`replace()` removes all matches. `replaceFirst()` or `deleteCharAt()` removes just one.

```java runnable
public class Main {
    public static void main(String[] args) {
        String s = "interview";

        System.out.println(s.replace("e", ""));                         // intrviw   -> removes ALL 'e'
        System.out.println(s.replaceFirst("e", ""));                    // intrview  -> removes only the FIRST 'e'
        System.out.println(new StringBuilder(s).deleteCharAt(3));       // intrview  -> removes the char at index 3
        System.out.println(removeByLoop(s, 'e'));                       // intrviw   -> loop, keep every other char
        System.out.println(removeByStream(s, 'e'));                     // intrviw   -> stream filter
    }

    static String removeByLoop(String s, char target) {
        StringBuilder result = new StringBuilder();
        for (char c : s.toCharArray()) {
            if (c != target) result.append(c);
        }
        return result.toString();
    }

    static String removeByStream(String s, char target) {
        return s.chars()
                .filter(c -> c != target)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }
}
```

</details>

<details><summary>split(String regex, int limit): how does the limit change the result?</summary>

`limit > 0` gives at most that many parts. `limit = 0` (default) removes trailing empty strings. `limit < 0` keeps them.

```java runnable
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        String data = "a,b,c,d,,";

        System.out.println(Arrays.toString(data.split(",")));       // [a, b, c, d]       -> default (limit 0): trailing empty strings removed
        System.out.println(Arrays.toString(data.split(",", 0)));    // [a, b, c, d]       -> same as above
        System.out.println(Arrays.toString(data.split(",", -1)));   // [a, b, c, d, , ]   -> negative limit keeps trailing empty strings
        System.out.println(Arrays.toString(data.split(",", 2)));    // [a, b,c,d,,]       -> at most 2 parts, the rest stays in the last part
        System.out.println(Arrays.toString(data.split(",", 3)));    // [a, b, c,d,,]      -> at most 3 parts
        System.out.println(data.split(",").length);                 // 4
        System.out.println(data.split(",", -1).length);             // 6
    }
}
```

</details>

<details><summary>Find the longest string in an array</summary>

Loop with a "longest so far" variable, or use `max` with a length comparator.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        String[] words = {"java", "spring", "hibernate", "sql"};

        System.out.println("Loop   : " + byLoop(words));      // hibernate -> keep the longest seen so far
        System.out.println("Stream : " + byStream(words));    // hibernate -> max by length
        System.out.println("Sorted : " + bySorting(words));   // hibernate -> sort by length, take the last
    }

    static String byLoop(String[] words) {
        String longest = words[0];
        for (String w : words) {
            if (w.length() > longest.length()) longest = w;
        }
        return longest;
    }

    static String byStream(String[] words) {
        return Arrays.stream(words).max(Comparator.comparingInt(String::length)).get();
    }

    static String bySorting(String[] words) {
        String[] copy = words.clone();
        Arrays.sort(copy, Comparator.comparingInt(String::length));
        return copy[copy.length - 1];
    }
}
```

</details>

</details>

---

<details open><summary>Concept 3: Collections Programs</summary>

<details><summary>⭐ Why does HashMap.get() return null for a custom key? (equals and hashCode)</summary>

HashMap finds a key using `hashCode()` and `equals()`. If the key class does not override them, two objects with the same data are treated as different keys.

```java runnable
import java.util.*;

class BadKey {
    int id;
    BadKey(int id) { this.id = id; }
}

class GoodKey {
    int id;
    GoodKey(int id) { this.id = id; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof GoodKey)) return false;
        return id == ((GoodKey) o).id;
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}

public class Main {
    public static void main(String[] args) {
        Map<BadKey, String> bad = new HashMap<>();
        bad.put(new BadKey(1), "A");
        System.out.println("Without equals/hashCode: " + bad.get(new BadKey(1)));   // null -> default equals/hashCode use object identity

        Map<GoodKey, String> good = new HashMap<>();
        good.put(new GoodKey(1), "A");
        System.out.println("With equals/hashCode   : " + good.get(new GoodKey(1)));  // A    -> same id means equal key
    }
}
```

</details>

<details><summary>⭐ HashMap vs Hashtable vs ConcurrentHashMap vs synchronizedMap vs unmodifiableMap</summary>

They differ in null handling, thread safety and mutability. `unmodifiableMap` is only a read-only view of the original map.

```java runnable
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class Main {
    public static void main(String[] args) {

        // HashMap: allows one null key and null values, not thread safe
        Map<String, String> hashMap = new HashMap<>();
        hashMap.put(null, "nullKey");
        hashMap.put("a", null);
        System.out.println(hashMap.get(null));          // nullKey -> one null key is allowed
        System.out.println(hashMap.get("a"));           // null    -> null values are allowed

        // Hashtable: legacy, every method synchronized, no nulls
        try {
            new Hashtable<String, String>().put(null, "x");
        } catch (NullPointerException e) {
            System.out.println("Hashtable null key -> NullPointerException");              // no null key or value allowed
        }

        // ConcurrentHashMap: thread safe with fine-grained locking, no nulls
        try {
            new ConcurrentHashMap<String, String>().put("a", null);
        } catch (NullPointerException e) {
            System.out.println("ConcurrentHashMap null value -> NullPointerException");    // null would be ambiguous in concurrent code
        }

        // synchronizedMap: wraps a HashMap with one lock, so nulls still work
        Map<String, String> syncMap = Collections.synchronizedMap(new HashMap<>());
        syncMap.put(null, "ok");
        System.out.println(syncMap.get(null));          // ok -> wrapper allows what the inner HashMap allows

        // unmodifiableMap: read-only view, writes throw
        Map<String, String> original = new LinkedHashMap<>();
        original.put("k", "v");
        Map<String, String> readOnly = Collections.unmodifiableMap(original);
        try {
            readOnly.put("x", "y");
        } catch (UnsupportedOperationException e) {
            System.out.println("unmodifiableMap put -> UnsupportedOperationException");     // cannot change through the view
        }
        original.put("k2", "v2");
        System.out.println(readOnly);                   // {k=v, k2=v2} -> it is a VIEW, changes to the original show up
    }
}
```

</details>

<details><summary>⭐ Remove elements from a list while iterating (ConcurrentModificationException)</summary>

Removing inside a for-each loop throws `ConcurrentModificationException`. Use `Iterator.remove()`, `removeIf()`, or build a new list.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        // Problem: for-each + remove
        try {
            List<Integer> list = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6));
            for (Integer n : list) {
                if (n % 2 == 0) list.remove(n);
            }
        } catch (ConcurrentModificationException e) {
            System.out.println("for-each remove -> ConcurrentModificationException");   // list changed while the iterator was running
        }

        // Approach 1: Iterator.remove()
        List<Integer> a = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6));
        Iterator<Integer> it = a.iterator();
        while (it.hasNext()) {
            if (it.next() % 2 == 0) it.remove();
        }
        System.out.println("Iterator : " + a);   // [1, 3, 5] -> iterator removes safely

        // Approach 2: removeIf
        List<Integer> b = new ArrayList<>(Arrays.asList(1, 2, 3, 4, 5, 6));
        b.removeIf(n -> n % 2 == 0);
        System.out.println("removeIf : " + b);   // [1, 3, 5] -> shortest way (Java 8), removes all matches

        // Approach 3: stream into a new list
        List<Integer> c = Arrays.asList(1, 2, 3, 4, 5, 6).stream()
                .filter(n -> n % 2 != 0)
                .collect(Collectors.toList());
        System.out.println("Stream   : " + c);   // [1, 3, 5] -> keeps the odd numbers in a new list
    }
}
```

</details>

<details><summary>⭐ Iterate over a HashMap in different ways</summary>

Use `entrySet()` when you need both key and value. Use `keySet()` or `values()` when you need only one.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Map<Integer, String> map = new LinkedHashMap<>();
        map.put(1, "One");
        map.put(2, "Two");
        map.put(3, "Three");

        System.out.print("entrySet: ");
        for (Map.Entry<Integer, String> e : map.entrySet()) {
            System.out.print(e.getKey() + "=" + e.getValue() + " ");   // 1=One 2=Two 3=Three -> best: one lookup per entry
        }

        System.out.print("\nkeySet  : ");
        for (Integer k : map.keySet()) {
            System.out.print(k + "=" + map.get(k) + " ");              // 1=One 2=Two 3=Three -> extra get() per key
        }

        System.out.print("\nvalues  : ");
        for (String v : map.values()) {
            System.out.print(v + " ");                                 // One Two Three -> values only
        }

        System.out.print("\nforEach : ");
        map.forEach((k, v) -> System.out.print(k + "=" + v + " "));    // 1=One 2=Two 3=Three -> Java 8 lambda
        System.out.println();
    }
}
```

</details>

<details><summary>⭐ Sort a list of objects (Comparable vs Comparator)</summary>

`Comparable` defines the natural order inside the class. `Comparator` defines any order outside the class, and can be chained.

```java runnable
import java.util.*;

class Person implements Comparable<Person> {
    private String name;
    private int age;

    Person(String name, int age) { this.name = name; this.age = age; }
    String getName() { return name; }
    int getAge() { return age; }

    @Override
    public int compareTo(Person other) {      // natural order: by age
        return Integer.compare(age, other.age);
    }

    @Override
    public String toString() { return name + "(" + age + ")"; }
}

public class Main {
    public static void main(String[] args) {
        List<Person> people = Arrays.asList(
                new Person("Ravi", 30), new Person("Asha", 25), new Person("Meena", 30));

        List<Person> l1 = new ArrayList<>(people);
        Collections.sort(l1);                                           // Comparable
        System.out.println("Comparable (age)     : " + l1);             // [Asha(25), Ravi(30), Meena(30)] -> natural order, equal ages keep original order

        List<Person> l2 = new ArrayList<>(people);
        l2.sort((a, b) -> a.getName().compareTo(b.getName()));          // Comparator lambda
        System.out.println("Comparator (name)    : " + l2);             // [Asha(25), Meena(30), Ravi(30)] -> alphabetical

        List<Person> l3 = new ArrayList<>(people);
        l3.sort(Comparator.comparing(Person::getAge).reversed()
                .thenComparing(Person::getName));                       // chained
        System.out.println("Age desc, then name  : " + l3);             // [Meena(30), Ravi(30), Asha(25)] -> oldest first, ties by name
    }
}
```

</details>

<details><summary>Push and pop: Stack, Deque and ArrayList as a stack</summary>

`Stack` is legacy. Prefer `ArrayDeque` (`push` / `pop` / `peek`). A plain `ArrayList` can also work by using the last index.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {

        // Approach 1: Stack (legacy, synchronized)
        Stack<Integer> stack = new Stack<>();
        stack.push(1); stack.push(2); stack.push(3);
        System.out.println(stack.pop());     // 3      -> last in, first out
        System.out.println(stack.peek());    // 2      -> looks at the top without removing
        System.out.println(stack);           // [1, 2] -> bottom to top

        // Approach 2: ArrayDeque (recommended)
        Deque<Integer> deque = new ArrayDeque<>();
        deque.push(1); deque.push(2); deque.push(3);
        System.out.println(deque);           // [3, 2, 1] -> push adds at the FRONT, so the top is printed first
        System.out.println(deque.pop());     // 3         -> removes from the front
        System.out.println(deque);           // [2, 1]

        // Approach 3: ArrayList (add at the end, remove from the end)
        List<Integer> list = new ArrayList<>();
        list.add(1); list.add(2); list.add(3);
        System.out.println(list.remove(list.size() - 1));   // 3 -> pop = remove the last index
        System.out.println(list);                           // [1, 2]
    }
}
```

</details>

</details>

---

<details open><summary>Concept 4: Java 8 Stream Programs</summary>

<details><summary>⭐ Find duplicate numbers in a list (and their count)</summary>

Use a `Set` (`add()` returns false for a repeat), group and count, or a plain loop. For "more than twice" change the filter to `> 2`.

```java runnable
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public class Main {
    static List<Integer> numbers = Arrays.asList(1, 2, 3, 2, 4, 1, 5);

    public static void main(String[] args) {
        System.out.println("Approach 1 (Set + stream)  : " + bySet());        // [2, 1]     -> numbers whose add() failed
        System.out.println("Approach 2 (groupingBy)    : " + byGrouping());   // {1=2, 2=2} -> number = how many times it appears
        System.out.println("Approach 3 (no Stream API) : " + byLoop());       // [1, 2]     -> plain loop with two sets
    }

    static List<Integer> bySet() {
        Set<Integer> seen = new HashSet<>();
        return numbers.stream()
                .filter(n -> !seen.add(n))
                .distinct()
                .collect(Collectors.toList());
    }

    static Map<Integer, Long> byGrouping() {
        return numbers.stream()
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet().stream()
                .filter(e -> e.getValue() > 1)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    static Set<Integer> byLoop() {
        Set<Integer> seen = new HashSet<>();
        Set<Integer> duplicates = new HashSet<>();
        for (Integer n : numbers) {
            if (!seen.add(n)) duplicates.add(n);
        }
        return duplicates;
    }
}
```

</details>

<details><summary>⭐ Find the first repeated and the first non-repeated number</summary>

First repeated: the first number where `Set.add()` fails. First non-repeated: the first number whose frequency is 1.

```java runnable
import java.util.*;

public class Main {
    static List<Integer> numbers = Arrays.asList(1, 2, 3, 2, 4, 1, 5);

    public static void main(String[] args) {
        System.out.println("First repeated (stream)     : " + firstRepeatedStream());      // 2 -> second 2 is the first repeat
        System.out.println("First repeated (loop)       : " + firstRepeatedLoop());        // 2 -> same, with a loop
        System.out.println("First non-repeated (stream) : " + firstNonRepeatedStream());   // 3 -> 1 and 2 repeat, 3 appears once
        System.out.println("First non-repeated (loop)   : " + firstNonRepeatedLoop());     // 3 -> same, with a loop
    }

    static Integer firstRepeatedStream() {
        Set<Integer> seen = new HashSet<>();
        return numbers.stream().filter(n -> !seen.add(n)).findFirst().orElse(null);
    }

    static Integer firstRepeatedLoop() {
        Set<Integer> seen = new HashSet<>();
        for (Integer n : numbers) {
            if (!seen.add(n)) return n;
        }
        return null;
    }

    static Integer firstNonRepeatedStream() {
        return numbers.stream()
                .filter(n -> Collections.frequency(numbers, n) == 1)
                .findFirst().orElse(null);
    }

    static Integer firstNonRepeatedLoop() {
        for (Integer n : numbers) {
            if (Collections.frequency(numbers, n) == 1) return n;
        }
        return null;
    }
}
```

</details>

<details><summary>⭐ Find the top 3 highest distinct numbers</summary>

Remove duplicates, sort in reverse order, take 3.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    static List<Integer> numbers = Arrays.asList(1, 2, 3, 2, 4, 1, 5);

    public static void main(String[] args) {
        System.out.println("Stream  : " + byStream());    // [5, 4, 3] -> distinct, sort descending, limit 3
        System.out.println("TreeSet : " + byTreeSet());   // [5, 4, 3] -> TreeSet sorts and removes duplicates
    }

    static List<Integer> byStream() {
        return numbers.stream()
                .distinct()
                .sorted(Comparator.reverseOrder())
                .limit(3)
                .collect(Collectors.toList());
    }

    static List<Integer> byTreeSet() {
        List<Integer> desc = new ArrayList<>(new TreeSet<>(numbers).descendingSet());
        return desc.subList(0, 3);
    }
}
```

</details>

<details><summary>⭐ Separate even and odd numbers</summary>

`partitioningBy` splits into exactly two groups (true / false). `groupingBy` can give custom group names.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    static List<Integer> numbers = Arrays.asList(1, 2, 3, 2, 4, 1, 5);

    public static void main(String[] args) {
        // Approach 1: partitioningBy
        Map<Boolean, List<Integer>> p = numbers.stream()
                .collect(Collectors.partitioningBy(n -> n % 2 == 0));
        System.out.println("Even: " + p.get(true));    // Even: [2, 2, 4]
        System.out.println("Odd : " + p.get(false));   // Odd : [1, 3, 1, 5]

        // Approach 2: groupingBy with names
        Map<String, List<Integer>> g = numbers.stream()
                .collect(Collectors.groupingBy(n -> n % 2 == 0 ? "Even" : "Odd", TreeMap::new, Collectors.toList()));
        System.out.println(g);                         // {Even=[2, 2, 4], Odd=[1, 3, 1, 5]} -> TreeMap keeps Even before Odd

        // Approach 3: plain loop
        List<Integer> even = new ArrayList<>(), odd = new ArrayList<>();
        for (int n : numbers) {
            if (n % 2 == 0) even.add(n); else odd.add(n);
        }
        System.out.println("Loop -> " + even + " " + odd);   // Loop -> [2, 2, 4] [1, 3, 1, 5]
    }
}
```

</details>

<details><summary>⭐ Find the second highest salary employee</summary>

Sort by salary descending and skip the first, or track the top two in one pass.

```java runnable
import java.util.*;

class Employee {
    private String name;
    private String dept;
    private int salary;

    Employee(String name, String dept, int salary) {
        this.name = name; this.dept = dept; this.salary = salary;
    }
    String getName() { return name; }
    String getDept() { return dept; }
    int getSalary() { return salary; }
}

public class Main {
    static List<Employee> list = Arrays.asList(
            new Employee("Asha", "IT", 90000), new Employee("Ravi", "IT", 70000),
            new Employee("Meena", "HR", 60000), new Employee("Kiran", "HR", 80000),
            new Employee("Sam", "Finance", 75000));

    public static void main(String[] args) {
        Employee a = list.stream()
                .sorted(Comparator.comparingInt(Employee::getSalary).reversed())
                .skip(1).findFirst().get();
        System.out.println("Stream      : " + a.getName() + " " + a.getSalary());   // Kiran 80000 -> 90000 is highest, skip it

        Employee first = null, second = null;
        for (Employee e : list) {
            if (first == null || e.getSalary() > first.getSalary()) { second = first; first = e; }
            else if (second == null || e.getSalary() > second.getSalary()) { second = e; }
        }
        System.out.println("Single pass : " + second.getName() + " " + second.getSalary());   // Kiran 80000 -> one loop, no sorting
    }
}
```

</details>

<details><summary>⭐ Group employees by department (count, names, highest paid)</summary>

`groupingBy` with a downstream collector gives count, names, or the max in each group.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

class Employee {
    private String name;
    private String dept;
    private int salary;

    Employee(String name, String dept, int salary) {
        this.name = name; this.dept = dept; this.salary = salary;
    }
    String getName() { return name; }
    String getDept() { return dept; }
    int getSalary() { return salary; }
}

public class Main {
    public static void main(String[] args) {
        List<Employee> list = Arrays.asList(
                new Employee("Asha", "IT", 90000), new Employee("Ravi", "IT", 70000),
                new Employee("Meena", "HR", 60000), new Employee("Kiran", "HR", 80000),
                new Employee("Sam", "Finance", 75000));

        System.out.println("Count   : " + list.stream().collect(
                Collectors.groupingBy(Employee::getDept, TreeMap::new, Collectors.counting())));
                // Count   : {Finance=1, HR=2, IT=2} -> employees per department

        System.out.println("Names   : " + list.stream().collect(
                Collectors.groupingBy(Employee::getDept, TreeMap::new,
                        Collectors.mapping(Employee::getName, Collectors.toList()))));
                // Names   : {Finance=[Sam], HR=[Meena, Kiran], IT=[Asha, Ravi]} -> names per department

        System.out.println("Highest : " + list.stream().collect(
                Collectors.groupingBy(Employee::getDept, TreeMap::new,
                        Collectors.collectingAndThen(
                                Collectors.maxBy(Comparator.comparingInt(Employee::getSalary)),
                                o -> o.get().getName()))));
                // Highest : {Finance=Sam, HR=Kiran, IT=Asha} -> top earner per department
    }
}
```

</details>

<details><summary>Count the frequency of each word in a sentence</summary>

Split into words, then group and count. A loop with `merge()` does the same.

```java runnable
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        String text = "java is fun and java is easy";

        Map<String, Long> a = Arrays.stream(text.split(" "))
                .collect(Collectors.groupingBy(Function.identity(), TreeMap::new, Collectors.counting()));
        System.out.println("Stream: " + a);   // {and=1, easy=1, fun=1, is=2, java=2} -> TreeMap sorts the words

        Map<String, Integer> b = new TreeMap<>();
        for (String w : text.split(" ")) b.merge(w, 1, Integer::sum);
        System.out.println("Loop  : " + b);   // {and=1, easy=1, fun=1, is=2, java=2} -> same result with merge()
    }
}
```

</details>

<details><summary>Sort a Map by value</summary>

Stream the entries, sort by value, and collect into a `LinkedHashMap` so the order is kept.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        Map<String, Integer> map = new HashMap<>();
        map.put("a", 3);
        map.put("b", 1);
        map.put("c", 2);

        Map<String, Integer> asc = map.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> x, LinkedHashMap::new));
        System.out.println("Ascending : " + asc);    // {b=1, c=2, a=3} -> smallest value first

        Map<String, Integer> desc = map.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (x, y) -> x, LinkedHashMap::new));
        System.out.println("Descending: " + desc);   // {a=3, c=2, b=1} -> largest value first
    }
}
```

</details>

<details><summary>Flatten a list of lists and join strings</summary>

`flatMap` turns many lists into one stream. `Collectors.joining` builds a single string.

```java runnable
import java.util.*;
import java.util.stream.Collectors;

public class Main {
    public static void main(String[] args) {
        List<List<Integer>> nested = Arrays.asList(
                Arrays.asList(1, 2), Arrays.asList(3, 4), Arrays.asList(5));

        List<Integer> flat = nested.stream()
                .flatMap(List::stream)
                .collect(Collectors.toList());
        System.out.println("Flat  : " + flat);     // [1, 2, 3, 4, 5] -> many lists become one list

        List<String> names = Arrays.asList("java", "spring", "sql");
        String joined = names.stream()
                .map(String::toUpperCase)
                .collect(Collectors.joining(", "));
        System.out.println("Joined: " + joined);   // JAVA, SPRING, SQL -> upper case, then join with ", "
    }
}
```

</details>

</details>

---

<details open><summary>Concept 5: Number and Logic Programs</summary>

<details><summary>⭐ Fibonacci series (first 10 numbers)</summary>

Each number is the sum of the two before it (0, 1, 1, 2, 3, 5, 8...). Iteration is the fastest. Plain recursion is slow, so add memoization. `Stream.iterate` is the Java 8 way.

```java runnable
import java.util.*;
import java.util.stream.*;

public class Main {
    static Map<Integer, Integer> memo = new HashMap<>();

    public static void main(String[] args) {
        System.out.println("Iterative: " + iterative(10));    // [0, 1, 1, 2, 3, 5, 8, 13, 21, 34] -> loop with two variables
        System.out.println("Recursion: " + IntStream.range(0, 10).map(Main::recursive).boxed().collect(Collectors.toList()));   // same list -> slow for large n
        System.out.println("Memo     : " + IntStream.range(0, 10).map(Main::memoized).boxed().collect(Collectors.toList()));    // same list -> recursion with cache
        System.out.println("Stream   : " + stream(10));       // same list -> Stream.iterate with a pair
    }

    static List<Integer> iterative(int n) {
        List<Integer> list = new ArrayList<>();
        int a = 0, b = 1;
        for (int i = 0; i < n; i++) {
            list.add(a);
            int next = a + b;
            a = b;
            b = next;
        }
        return list;
    }

    static int recursive(int n) {
        if (n <= 1) return n;
        return recursive(n - 1) + recursive(n - 2);
    }

    static int memoized(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);
        int result = memoized(n - 1) + memoized(n - 2);
        memo.put(n, result);
        return result;
    }

    static List<Integer> stream(int n) {
        return Stream.iterate(new int[]{0, 1}, f -> new int[]{f[1], f[0] + f[1]})
                .limit(n).map(f -> f[0]).collect(Collectors.toList());
    }
}
```

</details>

<details><summary>⭐ Check if a number is prime</summary>

Checking up to the square root is enough, because any divisor larger than that pairs with a smaller one.

```java runnable
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        for (int n : new int[]{29, 30, 1}) {
            System.out.println(n + " -> " + upToN(n) + " " + upToSqrt(n) + " " + byStream(n));
            // 29 -> true true true       (upToN, upToSqrt, byStream)
            // 30 -> false false false    -> divisible by 2
            // 1 -> false false false     -> 1 is not prime
        }
    }

    static boolean upToN(int n) {                  // slow: checks every number
        if (n <= 1) return false;
        for (int i = 2; i < n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    static boolean upToSqrt(int n) {               // fast: stops at sqrt(n)
        if (n <= 1) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    static boolean byStream(int n) {
        return n > 1 && IntStream.rangeClosed(2, (int) Math.sqrt(n)).noneMatch(i -> n % i == 0);
    }
}
```

</details>

<details><summary>⭐ Factorial of a number (loop, recursion, stream, BigInteger)</summary>

`n! = n × (n-1)!` for example 5! = 5 × 4 × 3 × 2 × 1. `long` overflows after 20!, so use `BigInteger` for large numbers.

```java runnable
import java.math.BigInteger;
import java.util.stream.LongStream;

public class Main {
    public static void main(String[] args) {
        System.out.println("Loop     : " + loop(5));          // 120 -> multiply 2..5
        System.out.println("Recursion: " + recursion(5));     // 120 -> n * factorial(n - 1), stops at 1
        System.out.println("Stream   : " + stream(5));        // 120 -> reduce with multiplication
        System.out.println("BigInteger 25! : " + big(25));    // 15511210043330985984000000 -> too big for long
    }

    static long loop(int n) {
        long result = 1;
        for (int i = 2; i <= n; i++) result *= i;
        return result;
    }

    static long recursion(int n) {
        return n <= 1 ? 1 : n * recursion(n - 1);
    }

    static long stream(int n) {
        return LongStream.rangeClosed(1, n).reduce(1, (a, b) -> a * b);
    }

    static BigInteger big(int n) {
        BigInteger result = BigInteger.ONE;
        for (int i = 2; i <= n; i++) result = result.multiply(BigInteger.valueOf(i));
        return result;
    }
}
```

</details>

<details><summary>⭐ Print numbers 1 to 50 without using any loop</summary>

Use recursion (the method calls itself with the next number) or a stream. No `for` / `while` is needed.

```java runnable
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        printRecursive(1, 50);
        System.out.println();                                // 1 2 3 ... 50 -> Approach 1: recursion, prints on one line

        IntStream.rangeClosed(1, 50).forEach(n -> System.out.print(n + " "));
        System.out.println();                                // 1 2 3 ... 50 -> Approach 2: IntStream

        System.out.println(IntStream.rangeClosed(1, 50)
                .mapToObj(String::valueOf)
                .collect(Collectors.joining(" ")));          // 1 2 3 ... 50 -> Approach 3: join into one string
    }

    static void printRecursive(int current, int max) {
        if (current > max) return;                           // base case stops the recursion
        System.out.print(current + " ");
        printRecursive(current + 1, max);                    // call itself with the next number
    }
}
```

</details>

<details><summary>⭐ Perfect number (sum of proper divisors equals the number)</summary>

A perfect number equals the sum of its divisors excluding itself. The smallest is 6 = 1 + 2 + 3. Checking up to the square root is faster than checking up to n/2.

```java runnable
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        for (int n : new int[]{6, 28, 12}) {
            System.out.println(n + " -> " + byHalfLoop(n) + " " + bySqrtLoop(n) + " " + byStream(n));
            // 6 -> true true true       -> 1 + 2 + 3 = 6
            // 28 -> true true true      -> 1 + 2 + 4 + 7 + 14 = 28
            // 12 -> false false false   -> 1 + 2 + 3 + 4 + 6 = 16, not 12
        }

        List<Integer> perfect = IntStream.rangeClosed(1, 10000)
                .filter(Main::bySqrtLoop).boxed().collect(Collectors.toList());
        System.out.println(perfect);   // [6, 28, 496, 8128] -> all perfect numbers up to 10000
    }

    static boolean byHalfLoop(int n) {             // check divisors up to n / 2
        if (n <= 1) return false;
        int sum = 0;
        for (int i = 1; i <= n / 2; i++) {
            if (n % i == 0) sum += i;
        }
        return sum == n;
    }

    static boolean bySqrtLoop(int n) {             // check divisors up to sqrt(n), add both i and n / i
        if (n <= 1) return false;
        int sum = 1;                               // 1 is always a proper divisor
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) {
                sum += i;
                if (i != n / i) sum += n / i;
            }
        }
        return sum == n;
    }

    static boolean byStream(int n) {
        return n > 1 && IntStream.rangeClosed(1, n / 2).filter(i -> n % i == 0).sum() == n;
    }
}
```

</details>

<details><summary>⭐ Armstrong number (sum of digits raised to the number of digits)</summary>

153 is an Armstrong number because 1³ + 5³ + 3³ = 153. The power is the count of digits in the number.

```java runnable
import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        for (int n : new int[]{153, 9474, 123}) {
            System.out.println(n + " -> " + byDigits(n) + " " + byString(n) + " " + byStream(n));
            // 153 -> true true true       -> 1^3 + 5^3 + 3^3 = 153
            // 9474 -> true true true      -> 9^4 + 4^4 + 7^4 + 4^4 = 9474
            // 123 -> false false false    -> 1^3 + 2^3 + 3^3 = 36
        }

        List<Integer> armstrong = IntStream.rangeClosed(1, 10000)
                .filter(Main::byDigits).boxed().collect(Collectors.toList());
        System.out.println(armstrong);   // [1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407, 1634, 8208, 9474]
    }

    static boolean byDigits(int n) {               // math: take the last digit with % 10
        int digits = String.valueOf(n).length();
        int sum = 0, temp = n;
        while (temp > 0) {
            sum += (int) Math.round(Math.pow(temp % 10, digits));
            temp /= 10;
        }
        return sum == n;
    }

    static boolean byString(int n) {               // loop over the characters
        String s = String.valueOf(n);
        int sum = 0;
        for (char c : s.toCharArray()) {
            sum += (int) Math.round(Math.pow(c - '0', s.length()));
        }
        return sum == n;
    }

    static boolean byStream(int n) {
        String s = String.valueOf(n);
        return s.chars().map(c -> (int) Math.round(Math.pow(c - '0', s.length()))).sum() == n;
    }
}
```

</details>

<details><summary>Swap two numbers without a third variable</summary>

Use a temp variable, arithmetic, or XOR. Interviewers usually want the arithmetic or XOR version.

```java runnable
public class Main {
    public static void main(String[] args) {
        withTemp();         // Temp      : a=20 b=10 -> uses an extra variable
        withArithmetic();   // Arithmetic: a=20 b=10 -> add, then subtract (can overflow for huge values)
        withXor();          // XOR       : a=20 b=10 -> bitwise, no overflow
    }

    static void withTemp() {
        int a = 10, b = 20;
        int temp = a; a = b; b = temp;
        System.out.println("Temp      : a=" + a + " b=" + b);
    }

    static void withArithmetic() {
        int a = 10, b = 20;
        a = a + b;   // a = 30
        b = a - b;   // b = 10
        a = a - b;   // a = 20
        System.out.println("Arithmetic: a=" + a + " b=" + b);
    }

    static void withXor() {
        int a = 10, b = 20;
        a = a ^ b;
        b = a ^ b;
        a = a ^ b;
        System.out.println("XOR       : a=" + a + " b=" + b);
    }
}
```

</details>

<details><summary>GCD and LCM of two numbers</summary>

Euclid's rule: `gcd(a, b) = gcd(b, a % b)`. Then `lcm = a * b / gcd`.

```java runnable
import java.math.BigInteger;

public class Main {
    public static void main(String[] args) {
        int a = 48, b = 18;
        System.out.println("GCD loop     : " + gcdLoop(a, b));        // 6   -> Euclid with a loop
        System.out.println("GCD recursion: " + gcdRecursion(a, b));   // 6   -> Euclid with recursion
        System.out.println("GCD BigInteger: " + BigInteger.valueOf(a).gcd(BigInteger.valueOf(b)));   // 6 -> built-in
        System.out.println("LCM          : " + (a * b / gcdLoop(a, b)));   // 144 -> 48 * 18 / 6
    }

    static int gcdLoop(int a, int b) {
        while (b != 0) {
            int t = b;
            b = a % b;
            a = t;
        }
        return a;
    }

    static int gcdRecursion(int a, int b) {
        return b == 0 ? a : gcdRecursion(b, a % b);
    }
}
```

</details>

</details>

---

<details open><summary>Concept 6: Array Programs</summary>

<details><summary>⭐ Find the missing numbers in a sorted array</summary>

Input has numbers from 0 to 23 with gaps. Find the least and highest value, build what should be there, and remove what is present. A boolean array or a gap check also works.

```java runnable
import java.util.*;
import java.util.stream.*;

public class Main {
    static int[] array = {0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 20, 21, 23};

    public static void main(String[] args) {
        System.out.println("List removeAll : " + byRemoveAll());    // [5, 16, 17, 19, 22] -> expected list minus given list
        System.out.println("Boolean array  : " + byBooleanArray()); // [5, 16, 17, 19, 22] -> mark present, report unmarked
        System.out.println("Stream + Set   : " + byStream());       // [5, 16, 17, 19, 22] -> filter numbers not in the set
        System.out.println("Gap check      : " + byGaps());         // [5, 16, 17, 19, 22] -> compare neighbours in a sorted array
    }

    static int least()   { return array[0]; }                       // array is sorted, otherwise call Arrays.sort() first
    static int highest() { return array[array.length - 1]; }

    static List<Integer> byRemoveAll() {
        List<Integer> expected = IntStream.rangeClosed(least(), highest()).boxed().collect(Collectors.toList());
        List<Integer> given = Arrays.stream(array).boxed().collect(Collectors.toList());
        expected.removeAll(given);
        return expected;
    }

    static List<Integer> byBooleanArray() {
        boolean[] present = new boolean[highest() - least() + 1];
        for (int n : array) present[n - least()] = true;
        List<Integer> missing = new ArrayList<>();
        for (int i = 0; i < present.length; i++) {
            if (!present[i]) missing.add(i + least());
        }
        return missing;
    }

    static List<Integer> byStream() {
        Set<Integer> given = Arrays.stream(array).boxed().collect(Collectors.toSet());
        return IntStream.rangeClosed(least(), highest())
                .filter(n -> !given.contains(n)).boxed().collect(Collectors.toList());
    }

    static List<Integer> byGaps() {
        List<Integer> missing = new ArrayList<>();
        for (int i = 1; i < array.length; i++) {
            for (int m = array[i - 1] + 1; m < array[i]; m++) missing.add(m);
        }
        return missing;
    }
}
```

</details>

<details><summary>⭐ Find duplicate numbers in an array</summary>

Sort and compare neighbours, use a `Set`, or count with a stream.

```java runnable
import java.util.*;
import java.util.function.Function;
import java.util.stream.*;

public class Main {
    static int[] numbers = {1, 5, 23, 2, 1, 6, 3, 1, 8, 12, 3};

    public static void main(String[] args) {
        System.out.println("Sort + neighbours: " + bySorting());   // [1, 3]       -> after sorting, equal values sit next to each other
        System.out.println("Set              : " + bySet());       // [1, 3]       -> add() fails for a repeated value
        System.out.println("Stream count     : " + byCount());     // {1=3, 3=2}   -> duplicate = how many times it appears
    }

    static Set<Integer> bySorting() {
        int[] sorted = numbers.clone();
        Arrays.sort(sorted);                                       // 1 1 1 2 3 3 5 6 8 12 23
        Set<Integer> duplicates = new LinkedHashSet<>();
        for (int i = 1; i < sorted.length; i++) {
            if (sorted[i] == sorted[i - 1]) duplicates.add(sorted[i]);
        }
        return duplicates;
    }

    static Set<Integer> bySet() {
        Set<Integer> seen = new HashSet<>();
        Set<Integer> duplicates = new LinkedHashSet<>();
        for (int n : numbers) {
            if (!seen.add(n)) duplicates.add(n);
        }
        return duplicates;
    }

    static Map<Integer, Long> byCount() {
        Map<Integer, Long> count = Arrays.stream(numbers).boxed()
                .collect(Collectors.groupingBy(Function.identity(), TreeMap::new, Collectors.counting()));
        count.values().removeIf(v -> v < 2);
        return count;
    }
}
```

</details>

<details><summary>⭐ Find the second largest number in an array</summary>

Sorting is simple. A single pass is the efficient answer (O(n)).

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] a = {12, 35, 1, 10, 34, 1};
        System.out.println("Sorting     : " + bySorting(a));    // 34 -> sort, take the largest value that differs from the max
        System.out.println("Single pass : " + singlePass(a));   // 34 -> track first and second in one loop
        System.out.println("Stream      : " + byStream(a));     // 34 -> sort descending, distinct, skip 1
    }

    static int bySorting(int[] a) {
        int[] c = a.clone();
        Arrays.sort(c);
        for (int i = c.length - 2; i >= 0; i--) {
            if (c[i] != c[c.length - 1]) return c[i];
        }
        return -1;
    }

    static int singlePass(int[] a) {
        int first = Integer.MIN_VALUE, second = Integer.MIN_VALUE;
        for (int n : a) {
            if (n > first) { second = first; first = n; }
            else if (n > second && n != first) { second = n; }
        }
        return second;
    }

    static int byStream(int[] a) {
        return Arrays.stream(a).boxed()
                .sorted(Comparator.reverseOrder())
                .distinct().skip(1).findFirst().get();
    }
}
```

</details>

<details><summary>⭐ Find the missing number in 1 to n</summary>

Expected sum minus actual sum gives the missing number. XOR also works and cannot overflow.

```java runnable
import java.util.Arrays;
import java.util.stream.IntStream;

public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 4, 5, 6};
        int n = 6;
        System.out.println("Sum formula: " + bySum(a, n));      // 3 -> 21 - 18
        System.out.println("XOR        : " + byXor(a, n));      // 3 -> equal numbers cancel out
        System.out.println("Stream     : " + byStream(a, n));   // 3 -> sum of range minus sum of array
    }

    static int bySum(int[] a, int n) {
        int expected = n * (n + 1) / 2;
        int actual = 0;
        for (int x : a) actual += x;
        return expected - actual;
    }

    static int byXor(int[] a, int n) {
        int x = 0;
        for (int i = 1; i <= n; i++) x ^= i;
        for (int v : a) x ^= v;
        return x;
    }

    static int byStream(int[] a, int n) {
        return IntStream.rangeClosed(1, n).sum() - Arrays.stream(a).sum();
    }
}
```

</details>

<details><summary>⭐ Two Sum: find two indexes whose values add up to a target</summary>

Brute force checks every pair (O(n²)). A HashMap finds the answer in one pass (O(n)).

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] nums = {2, 7, 11, 15};
        int target = 9;
        System.out.println("Brute force: " + Arrays.toString(bruteForce(nums, target)));   // [0, 1] -> 2 + 7 = 9, checks every pair
        System.out.println("HashMap    : " + Arrays.toString(byMap(nums, target)));        // [0, 1] -> looks up (target - current) in one pass
    }

    static int[] bruteForce(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) return new int[]{i, j};
            }
        }
        return new int[0];
    }

    static int[] byMap(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();   // value -> index
        for (int i = 0; i < nums.length; i++) {
            Integer j = seen.get(target - nums[i]);
            if (j != null) return new int[]{j, i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
```

</details>

<details><summary>⭐ Remove duplicates from an array</summary>

`LinkedHashSet` keeps the order. `distinct()` is the stream way. On a sorted array, two pointers work in place.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] a = {1, 2, 2, 3, 4, 4, 5};
        System.out.println("LinkedHashSet: " + Arrays.toString(bySet(a)));         // [1, 2, 3, 4, 5] -> set drops repeats, keeps order
        System.out.println("Stream       : " + Arrays.toString(byStream(a)));      // [1, 2, 3, 4, 5] -> distinct()
        System.out.println("Two pointers : " + Arrays.toString(twoPointers(a)));   // [1, 2, 3, 4, 5] -> in place, needs a sorted array
    }

    static int[] bySet(int[] a) {
        Set<Integer> set = new LinkedHashSet<>();
        for (int n : a) set.add(n);
        return set.stream().mapToInt(Integer::intValue).toArray();
    }

    static int[] byStream(int[] a) {
        return Arrays.stream(a).distinct().toArray();
    }

    static int[] twoPointers(int[] input) {          // array must be sorted
        int[] a = input.clone();
        int k = 1;
        for (int i = 1; i < a.length; i++) {
            if (a[i] != a[k - 1]) a[k++] = a[i];
        }
        return Arrays.copyOf(a, k);
    }
}
```

</details>

<details><summary>Binary search in a sorted array</summary>

Halve the search range each time (O(log n)). The array must be sorted.

```java runnable
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        int[] a = {2, 5, 8, 12, 16, 23, 38, 56};
        int target = 23;
        System.out.println("Iterative: " + iterative(a, target));                      // 5 -> index of 23, loop version
        System.out.println("Recursive: " + recursive(a, target, 0, a.length - 1));     // 5 -> same, recursive version
        System.out.println("Built-in : " + Arrays.binarySearch(a, target));            // 5 -> Arrays.binarySearch
    }

    static int iterative(int[] a, int target) {
        int low = 0, high = a.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (a[mid] == target) return mid;
            if (a[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }

    static int recursive(int[] a, int target, int low, int high) {
        if (low > high) return -1;
        int mid = low + (high - low) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) return recursive(a, target, mid + 1, high);
        return recursive(a, target, low, mid - 1);
    }
}
```

</details>

<details><summary>Maximum subarray sum (Kadane's algorithm)</summary>

Brute force tries every subarray (O(n²)). Kadane keeps a running sum and resets it when it turns negative (O(n)).

```java runnable
public class Main {
    public static void main(String[] args) {
        int[] a = {-2, 1, -3, 4, -1, 2, 1, -5, 4};
        System.out.println("Brute force: " + bruteForce(a));   // 6 -> best subarray is [4, -1, 2, 1], tries all
        System.out.println("Kadane     : " + kadane(a));       // 6 -> same answer in one pass
    }

    static int bruteForce(int[] a) {
        int max = Integer.MIN_VALUE;
        for (int i = 0; i < a.length; i++) {
            int sum = 0;
            for (int j = i; j < a.length; j++) {
                sum += a[j];
                max = Math.max(max, sum);
            }
        }
        return max;
    }

    static int kadane(int[] a) {
        int current = a[0], max = a[0];
        for (int i = 1; i < a.length; i++) {
            current = Math.max(a[i], current + a[i]);
            max = Math.max(max, current);
        }
        return max;
    }
}
```

</details>

</details>

---

<details open><summary>Concept 7: OOP Programs</summary>

<details><summary>⭐ Order of execution: static block, instance block, constructor (parent and child)</summary>

Static blocks run once when the class loads (parent first). For every `new`, the parent instance block and constructor run before the child's.

```java runnable
class Parent {
    static { System.out.println("1. Parent static block"); }       // runs once, when Parent is loaded
    { System.out.println("3. Parent instance block"); }            // runs for every new object, before the constructor
    Parent() { System.out.println("4. Parent constructor"); }
}

class Child extends Parent {
    static { System.out.println("2. Child static block"); }        // runs once, after Parent static block
    { System.out.println("5. Child instance block"); }
    Child() { System.out.println("6. Child constructor"); }
}

public class Main {
    public static void main(String[] args) {
        System.out.println("main start");     // main start
        new Child();                          // 1, 2, 3, 4, 5, 6 -> static blocks first (parent, then child), then parent, then child
        System.out.println("--- second object ---");   // --- second object ---
        new Child();                          // 3, 4, 5, 6 -> static blocks do not run again
    }
}
```

</details>

<details><summary>⭐ Method overriding vs static method hiding vs field hiding</summary>

Instance methods are decided at runtime by the object type (overriding). Static methods and fields are decided at compile time by the reference type.

```java runnable
class Parent {
    String name = "Parent field";
    void show() { System.out.println("Parent show"); }
    static void hello() { System.out.println("Parent static"); }
}

class Child extends Parent {
    String name = "Child field";
    @Override void show() { System.out.println("Child show"); }
    static void hello() { System.out.println("Child static"); }
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        p.show();                               // Child show    -> overriding: runtime object decides
        p.hello();                              // Parent static -> hiding: reference type decides
        System.out.println(p.name);             // Parent field  -> field: reference type decides
        System.out.println(((Child) p).name);   // Child field   -> after casting to Child
    }
}
```

</details>

<details><summary>⭐ Method signature and overriding rules (overriding vs overloading)</summary>

A method signature is the name plus the parameter list (number, type, order). Same signature in the subclass overrides. Different parameters overload.

```java runnable
class Parent {
    void info(String name, int age) { System.out.println("Parent info(String, int)"); }
}

class Child extends Parent {
    @Override
    void info(String name, int age) { System.out.println("Child info(String, int)"); }       // same signature -> OVERRIDES

    void info(int age, String name) { System.out.println("Child info(int, String)"); }       // different parameter order -> OVERLOADS
}

public class Main {
    public static void main(String[] args) {
        Parent p = new Child();
        p.info("Yash", 30);                // Child info(String, int) -> override is chosen at runtime
        // p.info(30, "Yash");             // COMPILE ERROR: Parent has no info(int, String), overload exists only in Child

        Child c = new Child();
        c.info(30, "Yash");                // Child info(int, String) -> overload is chosen at compile time
        c.info("Yash", 30);                // Child info(String, int) -> overriding method is used
    }
}
```

</details>

<details><summary>⭐ Is-A (inheritance) vs Has-A (composition)</summary>

`class Car extends Vehicle` means Car **is a** Vehicle. A `Car` that holds an `Engine` field **has an** Engine (composition).

```java runnable
class Engine {
    void start() { System.out.println("Engine started"); }
}

class Vehicle {
    void move() { System.out.println("Vehicle moves"); }
}

class Car extends Vehicle {                  // Is-A: Car is a Vehicle
    private Engine engine = new Engine();    // Has-A: Car has an Engine

    void drive() {
        engine.start();                      // uses the composed object
        move();                              // uses the inherited method
    }
}

public class Main {
    public static void main(String[] args) {
        Car car = new Car();
        car.drive();                                   // Engine started, then Vehicle moves (one per line)
        System.out.println(car instanceof Vehicle);    // true  -> Is-A relation
        System.out.println(car instanceof Engine == false); // true -> a Car is NOT an Engine, it only has one
    }
}
```

</details>

<details><summary>⭐ Diamond problem: why Java has no multiple inheritance of classes</summary>

A class cannot extend two classes. Interfaces with `default` methods can clash, so the class must choose, using `Interface.super.method()`.

```java runnable
interface A {
    default void hello() { System.out.println("Hello from A"); }
}

interface B {
    default void hello() { System.out.println("Hello from B"); }
}

// class C extends A, B { }      // COMPILE ERROR: a class can extend only one class (no multiple class inheritance)

class C implements A, B {
    @Override
    public void hello() {        // without this override: COMPILE ERROR, C inherits unrelated defaults for hello()
        A.super.hello();         // Hello from A -> choose A's version explicitly
        B.super.hello();         // Hello from B -> and/or B's version
    }
}

public class Main {
    public static void main(String[] args) {
        new C().hello();         // Hello from A, then Hello from B (one per line)
    }
}
```

</details>

<details><summary>⭐ Singleton design pattern (different ways)</summary>

Only one object per JVM. Enum is the simplest and safest. Double-checked locking needs `volatile`.

```java runnable
class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() {}
    static EagerSingleton getInstance() { return INSTANCE; }
}

class DoubleCheckedSingleton {
    private static volatile DoubleCheckedSingleton instance;
    private DoubleCheckedSingleton() {}
    static DoubleCheckedSingleton getInstance() {
        if (instance == null) {
            synchronized (DoubleCheckedSingleton.class) {
                if (instance == null) instance = new DoubleCheckedSingleton();
            }
        }
        return instance;
    }
}

class HolderSingleton {
    private HolderSingleton() {}
    private static class Holder { static final HolderSingleton INSTANCE = new HolderSingleton(); }
    static HolderSingleton getInstance() { return Holder.INSTANCE; }
}

enum EnumSingleton { INSTANCE }

public class Main {
    public static void main(String[] args) {
        System.out.println("Eager         : " + (EagerSingleton.getInstance() == EagerSingleton.getInstance()));                 // true -> created when the class loads
        System.out.println("Double-checked: " + (DoubleCheckedSingleton.getInstance() == DoubleCheckedSingleton.getInstance())); // true -> lazy, thread safe with volatile + lock
        System.out.println("Holder        : " + (HolderSingleton.getInstance() == HolderSingleton.getInstance()));               // true -> lazy, created when Holder loads
        System.out.println("Enum          : " + (EnumSingleton.INSTANCE == EnumSingleton.INSTANCE));                             // true -> safest, also safe from reflection and serialization
    }
}
```

</details>

<details><summary>⭐ Create an immutable class</summary>

Make the class `final`, fields `private final`, no setters, and copy mutable fields (like a `List`) on the way in and out.

```java runnable
import java.util.*;

final class Employee {
    private final String name;
    private final List<String> skills;

    Employee(String name, List<String> skills) {
        this.name = name;
        this.skills = new ArrayList<>(skills);                 // defensive copy in
    }

    String getName() { return name; }

    List<String> getSkills() {
        return Collections.unmodifiableList(skills);           // read-only view out
    }
}

public class Main {
    public static void main(String[] args) {
        List<String> skills = new ArrayList<>(Arrays.asList("Java", "SQL"));
        Employee e = new Employee("Asha", skills);

        skills.add("Python");                                  // change the original list
        System.out.println("Skills: " + e.getSkills());        // Skills: [Java, SQL] -> not affected, the class kept its own copy

        try {
            e.getSkills().add("Hacked");
        } catch (UnsupportedOperationException ex) {
            System.out.println("Cannot modify -> UnsupportedOperationException");   // the returned list is read-only
        }
    }
}
```

</details>

<details><summary>length vs length() vs size()</summary>

Arrays have a `length` field. `String` and `StringBuilder` have a `length()` method. Collections and maps have a `size()` method.

```java runnable
import java.util.*;

public class Main {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};
        System.out.println(arr.length);                 // 3 -> array: field, no brackets

        String str = "Yash";
        System.out.println(str.length());               // 4 -> String: length() method

        StringBuilder sb = new StringBuilder("Java");
        System.out.println(sb.length());                // 4 -> StringBuilder: length() method

        List<Integer> list = Arrays.asList(1, 2, 3, 4, 5);
        System.out.println(list.size());                // 5 -> collection: size() method

        Map<String, String> map = new HashMap<>();
        map.put("a", "1");
        map.put("b", "2");
        System.out.println(map.size());                 // 2 -> map: size() method
        System.out.println(map.keySet() + " " + map.values());   // [a, b] [1, 2] -> keySet() gives keys, values() gives values
        System.out.println(map.entrySet());             // [a=1, b=2] -> entrySet() gives key-value pairs
    }
}
```

</details>

</details>

---

<details open><summary>Concept 8: Serialization and Properties</summary>

<details><summary>⭐ Serializable vs Externalizable, and the transient keyword</summary>

`Serializable` saves all fields automatically, except `transient` ones. `Externalizable` gives you full control through `writeExternal` / `readExternal` and needs a public no-argument constructor.

```java runnable
import java.io.*;

class User implements Serializable {
    private static final long serialVersionUID = 1L;
    String name;
    transient String password;               // transient: skipped during serialization

    User(String name, String password) { this.name = name; this.password = password; }
}

class Product implements Externalizable {
    String name;
    int price;

    public Product() {}                      // required by Externalizable
    Product(String name, int price) { this.name = name; this.price = price; }

    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeUTF(name);                  // you decide what is saved (price is NOT written)
    }

    @Override
    public void readExternal(ObjectInput in) throws IOException {
        name = in.readUTF();
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        User userCopy = roundTrip(new User("Yash", "secret123"));
        System.out.println(userCopy.name);        // Yash -> normal field is restored
        System.out.println(userCopy.password);    // null -> transient field is NOT saved, gets the default value

        Product productCopy = roundTrip(new Product("Pen", 10));
        System.out.println(productCopy.name);     // Pen  -> written in writeExternal()
        System.out.println(productCopy.price);    // 0    -> not written, so it gets the default value
    }

    // Writes the object to memory and reads it back (no file needed)
    @SuppressWarnings("unchecked")
    static <T> T roundTrip(T obj) throws Exception {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (ObjectOutputStream out = new ObjectOutputStream(bytes)) {
            out.writeObject(obj);
        }
        try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(bytes.toByteArray()))) {
            return (T) in.readObject();
        }
    }
}
```

</details>

<details><summary>Properties: read values, defaults, and a value that refers to another key</summary>

`Properties` is a `Hashtable<String, String>`-style map for configuration. `getProperty(key, default)` avoids nulls. A reference like `${base.dir}` must be replaced by your own code.

```java runnable
import java.io.StringReader;
import java.util.Properties;

public class Main {
    public static void main(String[] args) throws Exception {
        Properties config = new Properties();
        config.load(new StringReader("base.dir=/app\nlog.dir=${base.dir}/logs\ndb.user=admin"));   // normally loaded from a .properties file

        System.out.println(config.getProperty("db.user"));                 // admin -> existing key
        System.out.println(config.getProperty("db.password"));             // null  -> missing key
        System.out.println(config.getProperty("db.password", "none"));     // none  -> default value for a missing key

        String raw = config.getProperty("log.dir");
        System.out.println(raw);                                           // ${base.dir}/logs -> Properties does NOT resolve references

        String resolved = raw.replace("${base.dir}", config.getProperty("base.dir"));
        System.out.println(resolved);                                      // /app/logs -> resolved by our own code
    }
}
```

</details>

</details>

---

<details open><summary>Concept 9: Multithreading Programs</summary>

<details><summary>⭐ Different ways to create a thread (Runnable vs Thread)</summary>

Extend `Thread`, implement `Runnable` (preferred, you can still extend another class), use a lambda, or submit a `Callable` to an `ExecutorService` when you need a result.

```java runnable
import java.util.concurrent.*;

public class Main {
    static class MyThread extends Thread {
        public void run() { System.out.println("Extending Thread"); }
    }

    static class MyRunnable implements Runnable {
        public void run() { System.out.println("Implementing Runnable"); }
    }

    public static void main(String[] args) throws Exception {
        Thread t1 = new MyThread();
        t1.start();                  // Extending Thread -> uses up the single inheritance slot
        t1.join();

        Thread t2 = new Thread(new MyRunnable());
        t2.start();                  // Implementing Runnable -> preferred, class can still extend something else
        t2.join();

        Thread t3 = new Thread(() -> System.out.println("Lambda thread"));
        t3.start();                  // Lambda thread -> shortest form (Runnable has one method)
        t3.join();

        ExecutorService executor = Executors.newSingleThreadExecutor();
        Future<String> future = executor.submit(() -> "Callable result");
        System.out.println(future.get());   // Callable result -> Callable can return a value, Runnable cannot
        executor.shutdown();
    }
}
```

</details>

<details><summary>⭐ Race condition: fix a shared counter (synchronized vs AtomicInteger)</summary>

`count++` is not atomic, so two threads can lose updates. Fix it with `synchronized` or an `AtomicInteger`.

```java runnable
import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static int unsafeCount = 0;
    static int safeCount = 0;
    static AtomicInteger atomicCount = new AtomicInteger();

    static synchronized void incrementSafe() { safeCount++; }

    public static void main(String[] args) throws Exception {
        runTwoThreads(() -> { for (int i = 0; i < 10000; i++) unsafeCount++; });
        runTwoThreads(() -> { for (int i = 0; i < 10000; i++) incrementSafe(); });
        runTwoThreads(() -> { for (int i = 0; i < 10000; i++) atomicCount.incrementAndGet(); });

        System.out.println("Unsynchronized: " + unsafeCount);   // varies on every run, often less than 20000 -> updates are lost
        System.out.println("Synchronized  : " + safeCount);     // 20000 -> only one thread at a time runs the method
        System.out.println("AtomicInteger : " + atomicCount.get());   // 20000 -> lock-free atomic increment
    }

    static void runTwoThreads(Runnable task) throws InterruptedException {
        Thread a = new Thread(task), b = new Thread(task);
        a.start(); b.start();
        a.join(); b.join();
    }
}
```

</details>

<details><summary>⭐ Print odd and even numbers using two threads</summary>

Both threads share one lock. A thread prints only when it is its turn, otherwise it calls `wait()`. After printing it calls `notifyAll()`.

```java runnable
class OddEvenPrinter {
    private int current = 1;
    private final int max;

    OddEvenPrinter(int max) { this.max = max; }

    synchronized void print(boolean isOdd) throws InterruptedException {
        while (current <= max) {
            if ((current % 2 != 0) == isOdd) {
                System.out.println(Thread.currentThread().getName() + ": " + current);
                current++;
                notifyAll();             // wake the other thread
            } else {
                wait();                  // not my turn, release the lock and sleep
            }
        }
        notifyAll();                     // let the other thread finish too
    }
}

public class Main {
    public static void main(String[] args) {
        OddEvenPrinter printer = new OddEvenPrinter(10);

        Thread odd = new Thread(() -> {
            try { printer.print(true); } catch (InterruptedException e) { }
        }, "Odd ");

        Thread even = new Thread(() -> {
            try { printer.print(false); } catch (InterruptedException e) { }
        }, "Even");

        odd.start();
        even.start();
        // Odd : 1, Even: 2, Odd : 3, Even: 4, ... Odd : 9, Even: 10  (one per line, always alternating)
    }
}
```

</details>

<details><summary>⭐ Producer-Consumer problem using BlockingQueue</summary>

`BlockingQueue` does the waiting for you: `put()` blocks when full and `take()` blocks when empty.

```java runnable
import java.util.concurrent.*;

public class Main {
    public static void main(String[] args) throws Exception {
        BlockingQueue<Integer> queue = new ArrayBlockingQueue<>(2);     // small capacity forces the producer to wait

        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 5; i++) queue.put(i);              // blocks when the queue is full
                queue.put(-1);                                          // signal: no more items
            } catch (InterruptedException e) { }
        });

        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    int value = queue.take();                           // blocks when the queue is empty
                    if (value == -1) break;
                    System.out.println("Consumed " + value);            // Consumed 1, 2, 3, 4, 5 (one per line, in order)
                }
            } catch (InterruptedException e) { }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
    }
}
```

</details>

</details>

---

<details open><summary>Concept 10: Java 8+ Features</summary>

<details><summary>⭐ Avoid NullPointerException using Optional</summary>

`Optional` makes "maybe no value" explicit. Use `ofNullable`, then `orElse`, `map`, or `ifPresent` instead of null checks.

```java runnable
import java.util.Optional;

public class Main {
    public static void main(String[] args) {
        String name = null;

        // Approach 1: classic null check
        String a = (name != null) ? name.toUpperCase() : "Unknown";
        System.out.println("Null check : " + a);     // Null check : Unknown -> works, but easy to forget

        // Approach 2: Optional with default
        String b = Optional.ofNullable(name).map(String::toUpperCase).orElse("Unknown");
        System.out.println("Optional   : " + b);     // Optional   : Unknown -> empty Optional gives the default

        // Approach 3: Optional with a value
        String city = "hyderabad";
        Optional.ofNullable(city).map(String::toUpperCase)
                .ifPresent(c -> System.out.println("ifPresent  : " + c));   // ifPresent  : HYDERABAD -> runs only when a value exists

        // Approach 4: throw if missing
        try {
            Optional.ofNullable(name).orElseThrow(() -> new IllegalArgumentException("Name is required"));
        } catch (IllegalArgumentException e) {
            System.out.println("orElseThrow: " + e.getMessage());   // orElseThrow: Name is required -> fail fast when a value is mandatory
        }
    }
}
```

</details>

</details>