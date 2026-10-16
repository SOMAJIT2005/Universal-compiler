package edges;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
public class Edge {
    static void check(boolean condition) { if (!condition) throw new AssertionError(); }
    public static void main(String[] args) throws Exception {
        BigInteger huge = BigInteger.ONE.shiftLeft(200);
        check(huge.multiply(huge).bitLength() == 401);
        check(Long.parseLong("9223372036854775807") == Long.MAX_VALUE);
        List<Integer> numbers = new ArrayList<>(Arrays.asList(Integer.MAX_VALUE, 0, Integer.MIN_VALUE));
        Collections.sort(numbers); check(numbers.get(0) == Integer.MIN_VALUE);
        try { numbers.get(99); throw new AssertionError(); }
        catch (IndexOutOfBoundsException expected) {}
        String text = "বাংলা Unicode \uD83D\uDE80";
        Path file = Paths.get("java's & unicode.txt");
        Files.write(file, text.getBytes(StandardCharsets.UTF_8));
        check(new String(Files.readAllBytes(file), StandardCharsets.UTF_8).equals(text));
        check(new Scanner(System.in).nextLine().equals("spaces and symbols & 42"));
        System.out.print("Java edges OK");
    }
}
