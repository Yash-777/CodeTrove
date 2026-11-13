# Hashing vs Encryption

Hashing and encryption are both cryptographic techniques, but they solve different problems.

- **Hashing** proves data hasn't changed (integrity). It is one-way.
- **Encryption** hides data so only authorized parties can read it (confidentiality). It is two-way and needs a key.

---

## 1. Hashing

A hashing algorithm takes an input of any size and produces a **fixed-length** output (the hash or digest).

### Key properties

- **Irreversible (one-way):** you cannot recover the original input from the hash.
- **Deterministic:** the same input always produces the same hash, no matter how many times you run it.
- **Fixed length:** a word and an entire book both produce the same output size (e.g., SHA-256 gives 256 bits).
- **No key required.**

### Hash collision

Because the output length is fixed and the possible inputs are unlimited, two different inputs can in theory produce the same hash. This is called a **hash collision**. Good algorithms make collisions practically impossible to find. Broken ones (e.g., MD5) are deprecated.

> Collisions are a consequence of the fixed output size. Irreversibility comes from the one-way design: information is lost during hashing.

### Main use: storing passwords in a database

The database never stores the plain password, only its hash.

```text
Registration
  user password ──► hash algorithm ──► hash value ──► stored in DB

Login
  entered password ──► same hash algorithm ──► new hash
                                     │
                       compare with the hash stored in DB
                                     │
                          match → login success
                          no match → login failed
```

Example: hashing `codetrove` always yields the same output, so the stored hash and the login hash can be compared.

> **Best practice:** use a slow, salted password hash such as **bcrypt**, **scrypt** or **Argon2**, not a plain fast hash like SHA-256 or MD5.

---

## 2. Encryption

Encryption converts readable data (**plaintext**) into unreadable data (**ciphertext**) using an algorithm and a **key**. Only someone with the right key can decrypt it.

### Key properties

- **Reversible (two-way):** ciphertext can be turned back into plaintext.
- **Requires a key:** symmetric key or asymmetric key pair.
- **Goal:** secrecy and confidentiality.

### Same input, same output?

- **Legacy / deterministic mode:** the same input, key and settings produce the **same** ciphertext every time.
- **Modern modes (random IV / nonce):** the same input produces a **different** ciphertext each time, yet it still decrypts correctly.

### 2.1 Symmetric encryption

The **same key** encrypts and decrypts.

- **Examples:** Wi-Fi password (WPA2/WPA3), BitLocker disk encryption.
- **Algorithms:** AES, Blowfish.
- **Pros:** fast, good for large data.
- **Cons:** the key must be shared securely.

**Try it:** [CodeTrove Cryptography tool](https://yash-777.github.io/CodeTrove/#/build/tools/cryptography)

Tool settings in legacy mode:

| Setting | Value |
|---|---|
| Mode | Legacy defaults |
| Key size | 128 bit |
| Iterations | 1,024 |
| Creation date/time (local) | `11-11-2026 14:52:48` |

In legacy mode, providing the same creation date/time generates the same encrypted output.

### 2.2 Asymmetric encryption (key pairs)

Each party has a **public key** (shared openly) and a **private key** (kept secret).

- Encrypt with the recipient's **public key**, decrypt with their **private key**.
- **Algorithms:** RSA, elliptic-curve (ECC).
- **Used by:** HTTPS / TLS / SSL sessions, and WhatsApp end-to-end encryption.
- **Pros:** no shared secret needed up front.
- **Cons:** slower than symmetric encryption.

---

## 3. Key differences

| Feature | Hashing | Encryption |
|---|---|---|
| Direction | One-way (cannot get the original data back) | Two-way (ciphertext → plaintext with a key) |
| Key required | No | Yes (symmetric or asymmetric) |
| Output size | Fixed length (e.g., 256 bits) | Variable (usually same size as or larger than the input) |
| Primary goal | Integrity and verification | Confidentiality |
| Common examples | SHA-256, bcrypt, MD5 (deprecated) | AES, RSA, Blowfish |
| Typical use | Password storage, file integrity checks | Wi-Fi, disk encryption, HTTPS, messaging |

---

## 4. Real-world example: WhatsApp end-to-end encryption

With end-to-end encryption, messages are locked on your device, and only you and the recipient hold the keys needed to unlock them. See the [WhatsApp FAQ](https://faq.whatsapp.com/820124435853543).

### Core algorithms and mechanisms

| Mechanism | Role |
|---|---|
| **Signal Protocol** | Designed by Open Whisper Systems. Ensures only the sender and recipient can read messages. |
| **Curve25519** | Elliptic-curve Diffie-Hellman used to generate shared secret keys over an insecure network. |
| **Double Ratchet Algorithm** | Generates a new key for every message, giving forward secrecy: past messages stay safe if a key is compromised. |
| **AES-256 (CBC mode)** | Encrypts the message content with a 256-bit key. |
| **HMAC-SHA256** | Authenticates each message to guarantee integrity and prevent tampering. |
| **Asymmetric key pairs** | Each device has a public/private key pair. The private key never leaves the device. |
| **Media encryption** | Photos and videos are encrypted on the sender's device before upload. Only the decryption key and file link go to the recipient. |

Note that WhatsApp combines both techniques: asymmetric crypto to agree on keys, symmetric crypto (AES) to encrypt content, and hashing (HMAC-SHA256) to verify integrity.

---

## 5. Quick summary

- Need to **verify** data or **store passwords**? Use **hashing** (with salt, via bcrypt/Argon2).
- Need to **hide data and read it back later**? Use **encryption**.
  - One shared key → **symmetric** (AES).
  - Public/private pair → **asymmetric** (RSA, ECC).

---

## References

- [IBM: Symmetric encryption](https://www.ibm.com/think/topics/symmetric-encryption)
- [Entrust: Symmetric encryption](https://www.entrust.com/resources/learn/symmetric-encryption)
- [WhatsApp FAQ: End-to-end encryption](https://faq.whatsapp.com/820124435853543)
- [Security StackExchange: Cryptography used in WhatsApp](https://security.stackexchange.com/questions/120238/which-cryptography-algorithm-is-used-in-whatsapp-end-to-end-security)
- [CodeTrove Cryptography tool](#/build/tools/cryptography)