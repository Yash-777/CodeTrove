#### Object-Oriented Programming <sup>[oracle.com](https://www.oracle.com/java/technologies/oop.html)</sup>

Object-oriented programming is a method of programming based on a hierarchy of classes, and well-defined and cooperating objects.


🧱 The Foundation: Classes and Objects

Before diving into the pillars of OOP, you must understand the two core components:
• Class: A blueprint or template used to create objects. It defines the structure (fields/attributes) and behavior (methods).
• Object: An instance of a class. It represents a real-world entity with a specific state and behavior.

```java
// The Blueprint (Class)
class Car {
    String model; // Attribute
    
    void drive() { // Method
        System.out.println("The " + model + " is moving.");
    }
}

// The Real-World Instance (Object)
public class Main {
    public static void main(String[] args) {
        Car myCar = new Car(); // Creating an object
        myCar.model = "Tesla";
        myCar.drive(); // Outputs: The Tesla is moving.
    }
}
```


🏛️ The 4 Main Pillars of OOP

Java's entire OOP ecosystem relies on four fundamental concepts:

1. Encapsulation (Data Hiding)

Encapsulation bundles variables (data) and methods (behavior) into a single unit (a class) and restricts direct access from outside. You achieve this by declaring attributes as private and exposing access through public getters and setters.
• Goal: Keeps data safe from unauthorized modification.
• Example: You cannot change your bank balance directly; you must use a deposit() or withdraw() method.
```java
class BankAccount {
    private double balance; // Private variable hidden from external access

    public double getBalance() { // Getter
        return balance;
    }

    public void deposit(double amount) { // Setter with validation logic
        if (amount > 0) {
            balance += amount;
        }
    }
}
```

2. Inheritance (Code Reuse)

Inheritance allows a new class (subclass/child) to acquire the properties and methods of an existing class (superclass/parent) using the extends keyword.
• Goal: Prevents code duplication ("Don't Repeat Yourself" or DRY).
• Relationship: Establishes an "is-a" relationship (e.g., a Dog is a type of Animal).
```java
class Animal {
    void eat() {
        System.out.println("Eating...");
    }
}

class Dog extends Animal { // Dog inherits eat() from Animal
    void bark() {
        System.out.println("Barking...");
    }
}
```

3. Polymorphism (Many Forms)

Polymorphism allows objects to take on multiple forms. It occurs when classes are related to each other via inheritance. Java supports two types:
• Compile-time (Method Overloading): Multiple methods in the same class share the same name but have different parameters.
• Runtime (Method Overriding): A subclass provides a specific implementation of a method that is already defined in its parent class.
```java
class Sound {
    // Overloading: Same name, different parameters
    void makeNoise() { System.out.println("Generic sound"); }
    void makeNoise(String tone) { System.out.println("Sound in " + tone); }
}

class Cat extends Animal {
    // Overriding: Changing parent behavior
    @Override
    void eat() {
        System.out.println("Cat eats fish.");
    }
}
```

4. Abstraction (Hiding Complexity)

Abstraction hides complex internal implementation details and only shows essential features to the user. In Java, abstraction is achieved using abstract classes and interfaces.
• Goal: Reduces complexity by focusing on what the object does rather than how it does it.
• Example: When you drive a car, you push the gas pedal to accelerate. You do not need to know how the engine manages fuel injection under the hood.
```java
// Interface defining a contract without full implementations
interface Vehicle {
    void startEngine(); 
}

class CarImpl implements Vehicle {
    public void startEngine() {
        System.out.println("Engine started via combustion.");
    }
}
```