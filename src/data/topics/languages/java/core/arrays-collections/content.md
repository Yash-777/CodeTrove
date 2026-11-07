
#### Data Structures <code>Array, List</code>

> What are Data Structures?

Data Structure is used for organizing the data in memory. There are various ways of organizing the data in the memory, for eg. array, list, stack, queue, and many more.

A data structure is defined as a format for arranging, processing, accessing, and storing data.

> [Array](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html)

An array is a collection of similar data elements stored at contiguous memory locations. It is the simplest data structure where each data element can be accessed directly by only using its index number.

The length of an array is established when the array is created. After creation, its length is fixed. 

| An array of 10 elements |
| :--: |
| ![image](https://user-images.githubusercontent.com/17373064/222494943-5efa8e7a-4e89-4f52-8b9b-220eeb0354c9.png) |

> Creating, Initializing, and Accessing an Array
```java
int[] anArray;         // declares an array of integers
anArray = new int[10]; // allocates memory for 10 integers
anArray[0] = 100;      // initialize first element

System.out.println("Element 1 at index 0: " + anArray[0]);  // Accessing
```


> Copying Arrays  [`System.arraycopy(Object src, int srcPos, Object dest, int destPos, int length) : void`](https://docs.oracle.com/javase/7/docs/api/java/lang/System.html#arraycopy(java.lang.Object,%20int,%20java.lang.Object,%20int,%20int))

The **_java.lang.System.arraycopy()_** method copies an array from the specified source array, beginning at the specified position, to the specified position of the destination array. A subsequence of array components are copied from the source array referenced by src to the destination array referenced by dest.The number of components copied is equal to the length argument.

Exception thrown
 * IndexOutOfBoundsException − if copying would cause access of data outside array bounds.
 * ArrayStoreException − if an element in the src array could not be stored into the dest array because of a type mismatch.
 * NullPointerException − if either src or dest is null.

```java
int arr1[] = { 0, 1, 2, 3, 4, 5 };
int[] arr2 = new int[10];

// copies an array from the specified source array
System.arraycopy(arr1, 3, arr2, 2, 2);  // arr2 = { 0, 0, 3, 4, 0, 0, 0, 0, 0, 0} 
```

ArrayList internally uses System.arraycopy()  <sup>[sourcecode](https://github.com/Yash-777/jdk-source-code/blob/master/jdk1.4.2_src/java/util/ArrayList.java)</sup>

> Array Manipulations `(common tasks, such as copying, sorting and searching arrays)`

[java.util.Arrays](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html) methods
```
equals(int[] a, int[] a2)                     : boolean  //Returns true if the two specified arrays of ints are equal to one another.
copyOf(int[] original, int newLength)         : int[]    //Copies the specified array, truncating or padding with zeros (if necessary) so the copy has the specified length.
copyOfRange(int[] original, int from, int to) : int[]    //Copies the specified range of the specified array into a new array.
sort(int[] a)          : void     //Sorts the specified array into ascending numerical order.
parallelSort(int[] a)  : void     //Sorts the specified array into ascending numerical order.
```

```java
int[] copyFrom = { 0, 1, 2, 3, 4, 5 };
int[] copyTo  = java.util.Arrays.copyOfRange(copyFrom, 2, 5);
System.out.println(java.util.Arrays.toString(copyTo)); // [1,2,3,4]
```

Programs:
```
Find minimum and maximum value of an array
Reverse of an Array, find duplicate numbers, largest and smallest value
```

----


#### Collection Framework <code>Collection Sub-Interfaces  List, Set, Map</code>

> What is Collection in Java?

A [collection ]()— sometimes called a container — is simply an object that groups multiple elements into a single unit. Collections are used to store, retrieve, manipulate, and communicate aggregate data. Typically, they represent data items that form a natural group, such as a poker hand (a collection of cards), a mail folder (a collection of letters), or a telephone directory (a mapping of names to phone numbers).

Any group of individual objects which are represented as a single unit is known as the collection of the objects. In Java, a separate framework named the “Collection Framework” has been defined in JDK 1.2 which holds all the collection classes and interface in it. 
The Collection interface (java.util.Collection) and Map interface (java.util.Map) are the two main “root” interfaces of Java collection classes.

> What is the difference between Array and Collection in java?

| Array | Collection |
| :-- | :-- |
| Arrays have a set size, which means that once we build one, we can't change it to meet our needs.	| Collection are naturally grow-able and can be customized to meet our needs. We can change its size as per our requirement. |
| Objects and primitives can both be stored in arrays. |  Only object types can be stored in a collection. |

> Explain the various interfaces used in the Collection framework.

#### [List Interface](https://docs.oracle.com/javase/tutorial/collections/interfaces/list.html)

A List is an ordered Collection (sometimes called a sequence).
Lists may contain duplicate elements.

```
ArrayList:
DataStructure:ResiableArray
Ordered by index(insertion order is preserved) - Intert and retreivew the data in same order Ex: 1,2,3
Implements RandomAccess Interface. So that any rondom element can be accessed at same speed

Dis Adv:- For insertion and deletion of elements it is slow because it needs several shifts among the array indexs.

Vector: same as ArrayList but its synchronized (thread safe)
stack: same as vector     {s.push(10), s.pop(10)}

ArrayList al = new ArrayList( Arrays.asList("A", "B") );
List synchronizedList = Collecitons.synchronizedList( al );

```

```
LinkedList
DataStructure: DoubleLinkedList
ordered by index (means we can insert data between two nodes as well)  
Ex:- Input:  3->5->8->10, data = 2, position = 2
     Output: 3->2->5->8->10

LinkedList list = new LinkedList();
list.add(E element)
lsit.add(int index,E element)
```

<details>
  <summary>ArrayList vs LinkedList</summary>

---

 * ArrayList: If we are storing to a perticular index then it has to shift all the element.
 <br/>DataStructure:ResiableArray
 
 * LinkedList: we can store any node inbetwwen two node. 
 <br/>DataStructure: DoubleLinkedList

```java
ArrayList<Integer> al = new ArrayList<Integer>(); // Generics - Type argument
al.add(10);
al.add(30);
al.add(1, 20); // add(index, object)

al.get(0);
System.out.println(al);

LinkedList<Integer> ll = new LinkedList<Integer>();
ll.add(10);
ll.add(30);
ll.add(1, 20); // add(index, object)

ll.get(0);
ll.getFirst(); ll.getLast();
System.out.println(ll);
```

---

</details>

#### Set interface implementations: HashSet, TreeSet, and LinkedHashSet.

A Set is a Collection that cannot contain duplicate elements. 
```
HashSet: Elements inserted based on hashcode, insertion order is not maintained.
DataStructure - HashTable

LinkedHashSet: display in the order we insert
DataStructure - HashTable + DoubleLinkedList

TreeSet: Insertion order is not maintained as elements get sorted before insertion
DataStructure - BalancedTree
```

#### The Map Interface

A Map is an object that maps keys to values. A map cannot contain duplicate keys: Each key can map to at most one value. It models the mathematical function abstraction. The Map interface includes methods for basic operations (such as put, get, remove, containsKey, containsValue, size, and empty), bulk operations (such as putAll and clear), and collection views (such as keySet, entrySet, and values).

Map implementations: HashMap, TreeMap, and LinkedHashMap

> Cursors are mainly used to access the elements of any collection. We have the following three types of cursors in Collection Framework:

 * Iterator: This cursor is used to access the elements in the forward direction only. This cursor can be applied to any Collection Interfaces. While accessing the methods we can also delete the elements.
```
Syntax: Iterator it = c.iterator();

Methods of Iterator:
boolean hasNext(): returns true if there is a next element in the array list.
Object next(): returns the next element in the array list.
void remove(): removes an element from an array list.
```

 * ListIterator: This cursor is used to access the elements of Collection in both forward and backward directions. This cursor can be applied only for List category Collections. While accessing the methods we can also add, set, delete elements.

```
LinkedList < Integer > ll = new LinkedList < Integer > ();

ListIterator < Integer > lit = ll.listIterator ();
  System.out.println ("Elements in Forward Direction");
  while (lit.hasNext ())
  {
   System.out.println (lit.next () + " ");
  }

    System.out.println ("\n elements in Backward direction");
    while (lit.hasPrevious ())
    {
     System.out.println (lit.previous () + " ");
    }
```

 * Enumeration: This cursor is used to access the elements of Collection only in a forward direction. This is a legacy cursor and can be applied only for legacy classes like Vector, Stack, Hashtable.
```
Methods of Enumeration
boolean hasMoreElements(): When implemented, it must return true while there are still more elements to extract
                           and false when all the elements have been enumerated.
Object nextElement(): This returns the next object in the enumeration as a generic Object reference.

Vector<Integer> v = new Vector<Integer>();
Enumeration e = v.elements();
  while(e.hasMoreElements()) {
   System.out.println(e.nextElement()+" ");
  }
```

Comparison Between Iterator, ListIterator and Enumeration Cursors in Java <sup>[ref](https://dotnettutorials.net/lesson/cursors-collection-framework-in-java/)</sup>

![image](https://user-images.githubusercontent.com/17373064/222525611-f68999a5-ebf4-4ce3-865c-386c1b74ecc4.png)

> ArrayList vs Vector

<details>
  <summary>HashMap vs Hashtable</summary>

---

>> [HashMap vs Hashtable](https://stackoverflow.com/a/48094803/5081877)

![](https://i.stack.imgur.com/AerdR.png)

> Null Keys And Null Values

HashMap allows maximum one null key and any number of null values. Where as Hashtable doesn’t allow even a single null key and null value, if the key or value null is then it throws NullPointerException.

```java
Hashtable<String, Integer> hashTable = new Hashtable<String, Integer>();
//hashTable.put(null, null); // java.lang.NullPointerException
//hashTable.put("null", null); // java.lang.NullPointerException
System.out.println(hashTable);

HashMap<String, Integer> hashMap = new HashMap<String, Integer>();
hashMap.put(null, null);
hashMap.put("nul", null);
System.out.println(hashMap);
```

> Structure 

HashMap, Hashtable in case of hash collisions they store the map entries in linked lists. From Java8 for HashMap if hash bucket grows beyond a certain threshold, that bucket will switch from linked list of entries to a balanced tree.

> Collection-view iteration, Fail-Fast and Fail-Safe

Iterator is a fail-fast in nature. i.e it throws ConcurrentModificationException if a collection is modified while iterating other than it’s own remove() method. Where as Enumeration is fail-safe in nature. It doesn’t throw any exceptions if a collection is modified while iterating.

---

</details>

#### Concurrent Collections <sup>[oracle tutorial](https://docs.oracle.com/javase/tutorial/essential/concurrency/collections.html)</sup>

The java.util.concurrent package includes a number of additions to the Java Collections Framework. These are most easily categorized by the collection interfaces provided:

 * [BlockingQueue](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/BlockingQueue.html) defines a first-in-first-out data structure that blocks or times out when you attempt to add to a full queue, or retrieve from an empty queue.
 * [ConcurrentMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentMap.html) is a subinterface of [java.util.Map](https://docs.oracle.com/javase/8/docs/api/java/util/Map.html) that defines useful atomic operations. These operations remove or replace a key-value pair only if the key is present, or add a key-value pair only if the key is absent. Making these operations atomic helps avoid synchronization. The standard general-purpose implementation of ConcurrentMap is [ConcurrentHashMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentHashMap.html), which is a concurrent analog of [HashMap](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html).
 * [ConcurrentNavigableMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentNavigableMap.html) is a subinterface of ConcurrentMap that supports approximate matches. The standard general-purpose implementation of ConcurrentNavigableMap is [ConcurrentSkipListMap](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentSkipListMap.html), which is a concurrent analog of [TreeMap](https://docs.oracle.com/javase/8/docs/api/java/util/TreeMap.html).
