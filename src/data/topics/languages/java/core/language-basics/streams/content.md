# Streams

Java Streams allow you to process collections easily without writing manual loops. They use operations like `filter()` and `map()` to process data, and the pipeline executes only when a terminal operation like `toList()` or `forEach()` is called.

Example:
```java
  List<String> names = List.of("Ann", "Bob", "Cy", "Dee");
  List<String> longNames = names.stream()
      .filter(n -> n.length() > 2)
      .map(String::toUpperCase)
      .collect(Collectors.toList());
  // -> ["ANN", "BOB", "DEE"]
```

----

```java
int[] intArr = {1, 2, 3, 4};
List<int[]> intArrList = Arrays.asList( intArr );     // Wrong - [[I@7852e922]
List<Integer> intList  = Arrays.asList( 1, 2, 3, 4 ); // [1, 2, 3, 4]
List<String>  intStringList = Arrays.asList( intArr.toString() ); // Wrong - [[I@7852e922]

ArrayList<Integer> al = new ArrayList<Integer>(); // Generics - Type argument
al.add(10);
al.add(30);
al.add(1, 20); // add(index, object)


HashMap<Integer, String> map = new HashMap<Integer, String>(); // nulls are accepted for k,v
map.put(null, null);
map.put(10, null);
map.put(10, "hai");
map.putIfAbsent(10, "modi");
System.out.println(map);

ConcurrentHashMap<Integer, String> cmap = new ConcurrentHashMap();
//cmap.put(10, null); //java.lang.NullPointerException
cmap.put(10, "hai");
System.out.println(cmap);

Hashtable<Integer, String> ht = new Hashtable(); // Null is not allowing for K,V
//ht.put(null, null); //java.lang.NullPointerException
//ht.put(10, null);    //java.lang.NullPointerException
System.out.println(ht);
```

<details><summary>Executing Streams in Parallel <code>java.util.concurrent.ForkJoinPool.common.<a href="https://docs.oracle.com/javase/tutorial/collections/streams/parallelism.html">parallelism</a></code> <sup><a href="https://stackoverflow.com/questions/21163108/custom-thread-pool-in-java-8-parallel-stream">Custom thread pool in Java 8 parallel stream</a></sup> </summary>

----

> For all the Streams use property field: `System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "2");`

```java runnable
public class Main {
    public static void main(String[] args) {
      Integer limit = 1000;

      System.setProperty("java.util.concurrent.ForkJoinPool.common.parallelism", "2");
      java.util.Set<String> threadNames = java.util.stream.Stream.iterate(0, n -> n + 1)
              .parallel()
              .limit( limit ) // .limit(100000000 0): java.lang.OutOfMemoryError: Java heap space  -- 100000000
              .map(i -> Thread.currentThread().getName())
              .collect(java.util.stream.Collectors.toSet());
      System.out.println("threadNames:"+threadNames);
      // threadNames:[ForkJoinPool.commonPool-worker-1, ForkJoinPool.commonPool-worker-2, main]
    }
}
```

> For specific task use below

```java runnable
import java.util.Set;
import java.util.concurrent.ForkJoinPool;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public class Main {
    public static void main(String[] args) {
    	Integer limit = 100;
    	final int parallelism = 8;
    	ForkJoinPool forkJoinPool = null;
    	try {
    		forkJoinPool = new ForkJoinPool(parallelism);
    		final Set<String> threadNamesPoolSized = java.util.concurrent.CompletableFuture.supplyAsync(() -> 
    			// Parallel task here, start ...
    		
    			Stream.iterate(0, n -> n + 1)
    			.parallel()
    			.limit( limit ) // 100000000 0
    			.map(i -> Thread.currentThread().getName())
    			.collect(Collectors.toSet())
    			
    			// Parallel task here, end
    			,forkJoinPool
    		)  // <- passes dedicated fork-join pool as executor
    		.join();  // <- Wait for result from forkJoinPool
    		System.out.println("threadNamesPoolSized:"+ threadNamesPoolSized);
    	} finally {
    		if (forkJoinPool != null) {
    			forkJoinPool.shutdown();
    		}
    	}
    }
}
```


----

</details>

<details><summary>Find the Number of Occurrences of a Substring in a String <sup><a href="https://stackoverflow.com/a/45496942/5081877">stackpost</a>: Fromula: <code>(source.split(Pattern.quote("aa"), -1).length - 1) or (str.length() - str.replaceAll(Pattern.quote(subStr), "").length()) / subStr.length()</code></sup></summary>

---

Instead of using direct subString in `str.replaceAll(subStr, "")` we are using `Pattern.quote(subStr)` in replaceAll `str.replaceAll(java.util.regex.Pattern.quote(subStr), "")` to support SpecialChars like (`+`).

```java runnable
import java.util.regex.Pattern;

public class Main {
	public static void main(String[] args) {
		String source = "hello world, hello Yash";
		String charSeq = "hello";

	    System.out.println("countOccurrences:"+ countOccurrences(source, charSeq) ); // Output: 2
	    System.out.println("countOccurrences:"+ countOccurrences(source, "Yash") );  // 1
	    System.out.println("countOccurrences:"+ countOccurrences(source, "l") );     // 5
	    
	    System.out.println( source.split(Pattern.quote(charSeq), -1).length-1 ); // 2
	    System.out.println( source.split(Pattern.quote("l"), -1).length - 1 );   // 5
	}
	public static int countOccurrences(String str, String subStr) {
	    int strLength = str.length();
	    int replaceLength = str.replaceAll(java.util.regex.Pattern.quote(subStr), "").length();
	    int subStringLength = subStr.length();
	    
	    System.out.format("strLength:%d, replaceLength:%d, subStringLength:%d\n", strLength, replaceLength, subStringLength);
	    return (strLength - replaceLength) / subStringLength;
	}
}
```

---

</details>

<details><summary>String Reverse Java8 <sup><a href="https://stackoverflow.com/a/53814169/5081877">stackpost</a></sup></summary>

---

```java
String str = "Hello World";
int strLength = str.length();
IntFunction<String> reverseMapper = (i) -> Character.toString( ( str.charAt( strLength -1 - i) ) );

String reverseString = IntStream.range(0, strLength) // for (int i = 0; i < strLength ; i++) { ... }
		.mapToObj( reverseMapper )                 // array[ lastElement ]
		.collect(Collectors.joining())             // Joining stream of elements together into a String.
		.toString();                               // This object (which is already a string!) is itself returned.

System.out.println("Reverse Stream as String : "+ reverseString);
```

```java
public static String reverseString_Stream(String str) {
    IntStream cahrStream = str.chars();
    int[] array = cahrStream.map( x -> x ).toArray();

    IntFunction<String> reverseMapper = (i) -> ( Character.toString((char) array[ array.length -1 - i ]) );
                                      //(i) -> ( Character.toString((char) array[ (array.length - i) + (0 - 1) ]) );

    String reverseString = IntStream.range(o, array.length) // for (int i = from; i < upTo ; i++) { ... }
            .mapToObj( reverseMapper )                 // array[ lastElement ]
            .collect(Collectors.joining())             // Joining stream of elements together into a String.
            .toString();                               // This object (which is already a string!) is itself returned.

    System.out.println("Reverse Stream as String : "+ reverseString);
    return reverseString;
}
```

```java
String str = "Hello World";
    
// Reverse the string using StringBuilder and Stream
String reversed = str.chars()
    .mapToObj(c -> String.valueOf((char) c))
    .collect(Collectors.collectingAndThen(Collectors.toList(),
        lst -> {
          StringBuilder sb = new StringBuilder();
          for (int i = lst.size() - 1; i >= 0; i--) {
            sb.append(lst.get(i));
          }
          return sb;
        })).toString();

System.out.println("Original: " + str);
System.out.println("Reversed: " + reversed);
```

---

</details>

<details><summary>Array Reverse Java8 </summary>

---

```java
int[] arr = {333,444,5551, 4454, 11222};
IntFunction<Integer> reverseMapperArray = (i) -> ( arr[ arr.length -1 - i] );
Integer[] reverseArr = IntStream.range(0, arr.length)
		.mapToObj(reverseMapperArray)
		.toArray(Integer[]::new);
//System.out.println(  Arrays.asList(reverseArr) );
System.out.println( Arrays.toString(reverseArr) );
//Arrays.stream(reverseArr).forEach(System.out::println);
//Stream.of(reverseArr).forEach(System.out::println);
```

---

</details>

<details><summary>Common, Left, Right elements of two arrays <code>{1, 5, 7, 3, 4, 5, 5} {5, 6, 7, 2, 8, 0} : Left:[1, 3, 4], Right:[6, 2, 8, 0], Common:[5, 7]</code></summary>

---

```java
// Join - Left, Common, Right
Integer[] arr1 = {1, 5, 7, 3, 4, 5, 5};
int[] arr2 = {5, 6, 7, 2, 8, 0};

List<Integer> arr1List = Arrays.asList(arr1); // AutoBoxing is not allowed here.
List<Integer> arr2List = Arrays.stream( arr2 )
		.mapToObj( i -> i )  // int to Integer (AutoBoxing)
		.collect(Collectors.toList());

List<Integer> leftJoin = arr1List.stream().filter(i -> !arr2List.contains(i)).collect(Collectors.toList());
List<Integer> rightJoin = arr2List.stream().filter(i -> !arr1List.contains(i)).collect(Collectors.toList());
List<Integer> common = arr1List.stream().filter(i -> arr2List.contains(i)).distinct().collect(Collectors.toList());
System.out.println("Left:"+leftJoin);   // [1, 3, 4]
System.out.println("Right:"+rightJoin); // [6, 2, 8, 0]
System.out.println("Common:"+common);   // [5, 7]
```

---

</details>

<details><summary>Program which takes Input array <code>[32, 323, 333, 444, 5551, 4454, 11222, 1]</code> and generates output array having common digits <code>[333, 444, 1]</code></summary>

---

```java
public static void arrayIndexValueUniqueDigit() {
    int[] arr = {32, 323, 333, 444, 5551, 4454, 11222, 1, 121, 11, 12};
    
    int[] output = new int[arr.length];
    int oi = 0;
    for(int i = 0; i < arr.length; i++) {
        String arrStr = String.valueOf(arr[i]);
        
        char[] charArray = arrStr.toCharArray();
        
//        Arrays.sort(charArray);
//        System.out.println(charArray[0] +":---- :"+ charArray[charArray.length -1] );
//        if(charArray[0] == charArray[c.length -1]) output[oi++] = Integer.valueOf( arrStr );
        
        String firstDigit = ""+ charArray[0];
        for(int j = 0; j < charArray.length; j++) {
            if(j == 0) firstDigit = charArray[j]+"";
            else if (j > 0 && !(firstDigit.equals( charArray[j]+"" ))) break;
            
            if (j+1 == charArray.length && firstDigit.equals( charArray[j]+"" ) ) // last value check
            output[oi++] = Integer.valueOf( arrStr );
        }
        
    }
    System.out.println( Arrays.toString(output) );//[333, 444, 1, 11, 0, 0, 0, 0, 0, 0, 0]
}
```

---

```java
public static void main(String[] args) {
    int[] inputArray = {32, 323, 333, 444, 5551, 4454, 11222, 1, 121, 11, 12};
    
    int[] outputArray = Arrays.stream(inputArray)
        .filter(i -> hasSameDigits(i))
        .toArray();
        
    System.out.println(Arrays.toString(outputArray)); // [333, 444, 1, 11]
}
public static boolean hasSameDigits(int n) {
    String digits = Integer.toString(n);
    char[] charArray = digits.toCharArray();
    char firstDigit = charArray[0];

    for (char c : charArray) {
      if (c != firstDigit) {
        return false;
      }
    }
    return true;
}
```

Explanation:

 * The Arrays.stream() method is used to convert the input array to a stream of integers.
 * The filter() method is used to filter out any elements that do not have the same digits. This is achieved using the hasSameDigits() method, which checks if all the digits in the number are the same.
 * Finally, the toArray() method is used to convert the filtered stream back into an integer array.
 * The output array is then printed to the console using the Arrays.toString() method.
 * The hasSameDigits() method works by converting the integer to a string, and then checking if all the characters in the string are the same. If they are, the method returns true, otherwise it returns false.

---

</details>


> <code>Map(collection)</code> vs <code>flatmap(collection of collection)</code>

<details><summary><code>map(obj to obj)</code>: ex: <code>.mapToObj( i -> i )  // int to Integer (AutoBoxing)</code>, <code>map(i -> Thread.currentThread().getName())</code></summary>

---

```java
// Arrays To List from the Stream interface
List<Integer> intStreamList = 
    //(List<Integer>) Arrays.stream( arr ); // java.lang.ClassCastException: java.util.stream.IntPipeline$Head cannot be cast to java.util.List
        Arrays.stream( intArr )
            .mapToObj( i -> i )  // int to Integer (AutoBoxing)
            .collect(Collectors.toList());
System.out.println("intStreamList:"+intStreamList); // [1, 2, 3, 4]
```

```java
List<Student> slist = Arrays.asList(
        new Student("A", 34), new Student("AB", 35), new Student("C", 33), new Student("Z", 74)
        );

List<String> plist =  slist.stream()
        .filter(i -> i.getMarks() < 35)
        .map(i -> i.getName() ) // From Student Object get Name
        .collect(Collectors.toList());
System.out.println(plist); // [A, C]

@Data @AllArgsConstructor
class Student {
	String name; int marks;
}
```

---

</details>


<details><summary><code>flatmap(collection of collection)</code>: from List&lt;List&lt;Integer&gt;&gt; collect numbers collection as (all, even, odd)</summary>

---

```java
List<List<Integer>> oddEvenCollection = Arrays.asList(
        Arrays.asList(12,5,6,8,9,10,14,6,7),
        Arrays.asList(2,3,5,7,8,9)
);
List<Integer> allNumbers = oddEvenCollection.stream()
        .flatMap(List::stream)
        .sorted(java.util.Comparator.naturalOrder()) // Comparator.reverseOrder()
        .distinct()
        .collect(Collectors.toList());  // [2, 3, 5, 6, 7, 8, 9, 10, 12, 14]
List<Integer> evenNumbers = allNumbers.stream().filter(n -> n % 2 == 0).collect(Collectors.toList());// [2, 6, 8, 10, 12, 14]
List<Integer> oddNumbers = allNumbers.stream().filter(n -> n % 2 != 0).collect(Collectors.toList()); // [3, 5, 7, 9]
```

---

</details>


<details><summary><code>Map&lt;String, List&lt;String&gt;&gt;</code> data structure use <code>flatMap</code> and <code>forEach</code> methods from the Stream interface. To iterate over list values</summary>

---

```java
Map<String, List<String>> mapValueList = new HashMap<>();
mapValueList.put("key1", Arrays.asList("a", "b", "c"));
mapValueList.put("key2", Arrays.asList("d", "e", "f", "g"));
mapValueList.put("key3", Arrays.asList("h", "i", "j", "k", "l"));

List<String> flattenedValues = mapValueList.values().stream()
        .flatMap(List::stream)
        .collect(Collectors.toList());
System.out.println("flattenedValues list:"+ flattenedValues);

mapValueList.values().stream()
    .flatMap(List::stream) // .forEach(System.out::println);
    .forEach( e -> {
        System.out.println("List Value:"+e);
    });
```

To use `flatMap` and `forEach`, we first call the `values()` method on the map to obtain a Collection view of the map's values. Then, we convert the collection to a stream using the stream() method.

Next, we call `flatMap` on the stream, which takes a function that maps each list in the stream to its individual elements. In this case, we use List::stream to obtain a stream of the list's elements.

---

</details>


<details><summary>Map datastructure Sort based on Keys and Values</summary>

---

```java
SortedMap<String, Object> map = new TreeMap<>();
```

```java
Map<Integer, String> map = new HashMap<>(); // TreeMap - Direct sort based on key
map.put(10, "y"); map.put(5, "c"); map.put(50, "a");
map.put(4, "s");  map.put(7, "z"); map.put(1, "y");
System.out.println("Input Map: "+map);
```

Sort on List of Entries:
```java
// Create a linked list from the above map entries
List<Map.Entry<Integer, String>> list = new LinkedList<>(map.entrySet());
list.sort( Comparator.comparing(Map.Entry::getValue) );
System.out.println("List<Map.Entry<Integer, String>> Value Sort:"+list);
list.sort( Comparator.comparing(Map.Entry::getKey)   );
System.out.println("List<Map.Entry<Integer, String>> Key   Sort:"+list);
```

Map sort based on key's and Value's

```java
Map<Integer, String> result = map.entrySet().stream()
    //.sorted(Map.Entry.comparingByKey()) //.sorted(Map.Entry.comparingByValue())
    .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))  // HashMap
    //.sorted(Map.Entry.<String, Integer>comparingByValue().reversed()) //LinkedHashMap
    
    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (oldValue, newValue) -> oldValue, LinkedHashMap::new)); // sorted stream map
    //.collect(Collectors.toMap(k -> k.getKey(), e -> (String) e.getValue())); // Normal Map
System.out.println("Map Entries: "+ result); // {7=z, 1=y, 10=y, 4=s, 5=c, 50=a}
```

---


</details>

<details><summary><code>Dates API</code> : <code>List&lt;Product&gt;</code> find most recent sale date and Sale product item info
</summary>


```java
public class DatesTest {
    static String[] datePatterns = {
            "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", "yyyy-MM-dd'T'HH:mm:ss"
    };
    public static void main(String[] args) throws ParseException {
        
        String dateStr = "2019-07-25T18:00:00.000Z";
        Date parseDate = parseDate(dateStr, datePatterns[0]);
        System.out.println("Date :"+parseDate);
        System.out.println("LocalDate: "+getLocalDate(parseDate));
        System.out.println("OffsetDateTime: "+getOffsetDateTime(parseDate));
        
        List<Product> productList = Arrays.asList(
            getProduct(1, 100, "Product 1", "2019-07-25T18:00:00.000Z", "2019-01-01T00:00:00.000Z"),
            getProduct(2, 200, "Product 2", "2021-05-10T10:00:00.000Z", "2022-03-15T00:00:00.000Z"),
            getProduct(3, 150, "Product 3", "2022-09-05T08:00:00.000Z", "2021-11-30T00:00:00.000Z"),
            getProduct(4, 300, "Product 4", "2022-09-05T07:00:00.000Z", "2022-03-16T00:00:00.000Z")
                );
        
        Map<String, Product> productsMap = productList.stream()
        .filter(p -> p.price > 100)
        .collect(Collectors.toMap(Product::getName, Function.identity()));
        System.out.println("productsMap:"+productsMap);
        
        productList.stream().forEach(e -> { if (e.id==1) System.out.println(e.id); });
        // Find the most recent sale date
        String mostRecentSaleDate = productList.stream()
                .map(Product::getSaleDate)
                .max(Comparator.naturalOrder()).orElse(null);
        System.out.println("Most Recent Sale Date: " + mostRecentSaleDate);
        // Find the most recent manufactured date
        Date mostRecentManufacturedDate = productList.stream()
                .map(Product::getManufacturedDate)
                .max(Comparator.naturalOrder()).orElse(null);
        System.out.println("Most Recent Manufactured Date: " + mostRecentManufacturedDate);
        
        // Find the most recent Sale product item info
        Product mostRecentSaledProduct = productList.stream()
                .max(Comparator.comparing(p -> parseDate(p.getSaleDate(), datePatterns[0]) )).orElse(null);
        System.out.println("Most Recent Sale: " + mostRecentSaledProduct);
    }
    public static Product getProduct(int id, int price, String name, String saleDate, String mnfDate) {
        Date parseDate = parseDate(mnfDate, datePatterns[0]);
        return Product.builder().id(id).price(price)
                .name(name).saleDate(saleDate)
                .manufacturedDate( parseDate )
                .localDate( getLocalDate(parseDate) )
                .offsetDateTime( getOffsetDateTime(parseDate) )
                .build();
    }
    public static Date parseDate(String dateStr, String datePattern) {
        try {
            // Create a SimpleDateFormat object with the desired date format
            DateFormat dateFormat = new SimpleDateFormat( datePattern );
            // Parse the string date to obtain a Date object
            Date date = dateFormat.parse(dateStr);
            return date;
        } catch (ParseException e) {
            e.printStackTrace();
            return null;
        }
    }
    static ZoneId defaultZone = ZoneId.systemDefault(); // ZoneId.of("UTC");
    public static LocalDate getLocalDate(Date dateTime) {
        return dateTime.toInstant().atZone( defaultZone ).toLocalDate();
    }
    public static LocalDateTime getLocalDateTime(Date dateTime) {
        return dateTime.toInstant().atZone( defaultZone ).toLocalDateTime();
    }
    public static OffsetDateTime getOffsetDateTime(Date dateTime) {
        LocalDateTime localDateTime = getLocalDateTime(dateTime);
        ZoneOffset offset = defaultZone.getRules().getOffset( localDateTime );
        //return dateTime.toInstant().atOffset(offset);
        return OffsetDateTime.of(localDateTime, offset);
    }
}
@Data @Builder
class Product {
    int id, price;
    String name, saleDate;
    java.util.Date manufacturedDate;
    java.time.LocalDate localDate;
    java.time.OffsetDateTime offsetDateTime;
}
```

</details>

<details><summary><code>From <code>List&lt;Integer&gt;</code> objects fint repeated elements count <code>Arrays.asList(1,3,4,6,7,2,3,4,5,1,3,2,7,8,3,9,0,1,1,4 );</code> output as <code>{0=1, 1=4, 2=2, 3=4, 4=3, 5=1, 6=1, 7=2, 8=1, 9=1}</code></summary>

```java
List<Integer> highestRepeated = Arrays.asList(1,3,4,6,7,2,3,4,5,1,3,2,7,8,3,9,0,1,1,4 );
System.out.println( highestRepeated); // [1, 3, 4, 6, 7, 2, 3, 4, 5, 1, 3, 2, 7, 8, 3, 9, 0, 1, 1, 4]
Map<Integer, Long> map = highestRepeated.stream()
    //.collect(Collectors.toMap(Function.identity(), value -> 1, Integer::sum));
    //.collect( Collectors.groupingBy(Function.identity(), Collectors.summingInt(c -> 1)) ); // Map<Integer, Integer>
    .collect(Collectors.toMap(Function.identity(), value -> 1L, Long::sum, TreeMap::new));
    //.collect( Collectors.groupingBy(Function.identity(), Collectors.counting()) ); // Map<Integer, Long>
System.out.println("map:"+ map); // {0=1, 1=4, 2=2, 3=4, 4=3, 5=1, 6=1, 7=2, 8=1, 9=1}
```

</details>