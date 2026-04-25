import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

// --- Mocks ---

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// Typed imports for mocked modules
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

// --- Helpers ---

const makeProject = (id = "proj-1") => ({
  id,
  name: "Test Project",
  userId: "user-1",
  messages: "[]",
  data: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
});

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue(makeProject());
});

// --- Tests ---

describe("useAuth", () => {
  describe("initial state", () => {
    it("returns isLoading as false initially", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    it("exposes signIn and signUp functions", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });
  });

  // ─── signIn ──────────────────────────────────────────────────────────────

  describe("signIn", () => {
    it("sets isLoading to true while signing in and resets after", async () => {
      let resolveSignIn!: (v: { success: boolean }) => void;
      mockSignInAction.mockReturnValue(
        new Promise((res) => (resolveSignIn = res))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("calls signInAction with provided credentials", async () => {
      mockSignInAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockSignInAction).toHaveBeenCalledWith(
        "user@example.com",
        "password123"
      );
    });

    it("returns the result from signInAction", async () => {
      const authResult = { success: false, error: "Invalid credentials" };
      mockSignInAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: typeof authResult | undefined;

      await act(async () => {
        returnValue = await result.current.signIn("a@b.com", "wrong");
      });

      expect(returnValue).toEqual(authResult);
    });

    it("resets isLoading even when signInAction throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("does not redirect when sign-in fails", async () => {
      mockSignInAction.mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "bad-pass");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ─── signUp ──────────────────────────────────────────────────────────────

  describe("signUp", () => {
    it("sets isLoading to true while signing up and resets after", async () => {
      let resolveSignUp!: (v: { success: boolean }) => void;
      mockSignUpAction.mockReturnValue(
        new Promise((res) => (resolveSignUp = res))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp("new@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("calls signUpAction with provided credentials", async () => {
      mockSignUpAction.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockSignUpAction).toHaveBeenCalledWith(
        "new@example.com",
        "password123"
      );
    });

    it("returns the result from signUpAction", async () => {
      const authResult = { success: false, error: "Email already registered" };
      mockSignUpAction.mockResolvedValue(authResult);

      const { result } = renderHook(() => useAuth());
      let returnValue: typeof authResult | undefined;

      await act(async () => {
        returnValue = await result.current.signUp("taken@example.com", "pass");
      });

      expect(returnValue).toEqual(authResult);
    });

    it("resets isLoading even when signUpAction throws", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("a@b.com", "pass").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("does not redirect when sign-up fails", async () => {
      mockSignUpAction.mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("taken@b.com", "pass");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ─── post-sign-in routing: anon work ─────────────────────────────────────

  describe("handlePostSignIn — anonymous work exists", () => {
    const anonWork = {
      messages: [{ role: "user", content: "make a button" }],
      fileSystemData: { "/": {}, "/App.jsx": { content: "..." } },
    };

    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockSignInAction.mockResolvedValue({ success: true });
      mockSignUpAction.mockResolvedValue({ success: true });
    });

    it("creates a project with anon work data after successful sign-in", async () => {
      mockCreateProject.mockResolvedValue(makeProject("anon-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        })
      );
    });

    it("clears anon work after migrating it", async () => {
      mockCreateProject.mockResolvedValue(makeProject("anon-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockClearAnonWork).toHaveBeenCalled();
    });

    it("redirects to the newly created project after sign-in", async () => {
      mockCreateProject.mockResolvedValue(makeProject("anon-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/anon-proj");
    });

    it("does not fetch existing projects when anon work is present", async () => {
      mockCreateProject.mockResolvedValue(makeProject("anon-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });

    it("works the same way after successful sign-up", async () => {
      mockCreateProject.mockResolvedValue(makeProject("anon-proj-2"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@b.com", "pass");
      });

      expect(mockClearAnonWork).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-2");
    });
  });

  // ─── post-sign-in routing: empty anon work ───────────────────────────────

  describe("handlePostSignIn — anon work exists but has no messages", () => {
    beforeEach(() => {
      // Data key exists but messages array is empty
      mockGetAnonWorkData.mockReturnValue({
        messages: [],
        fileSystemData: { "/": {} },
      });
      mockSignInAction.mockResolvedValue({ success: true });
    });

    it("falls through to existing projects when messages array is empty", async () => {
      mockGetProjects.mockResolvedValue([makeProject("existing-proj")]);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockGetProjects).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/existing-proj");
    });
  });

  // ─── post-sign-in routing: existing projects ─────────────────────────────

  describe("handlePostSignIn — no anon work, existing projects", () => {
    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockSignInAction.mockResolvedValue({ success: true });
    });

    it("redirects to the most recent project", async () => {
      mockGetProjects.mockResolvedValue([
        makeProject("recent-proj"),
        makeProject("older-proj"),
      ]);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/recent-proj");
    });

    it("does not create a new project when one already exists", async () => {
      mockGetProjects.mockResolvedValue([makeProject("existing")]);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });

  // ─── post-sign-in routing: no projects ───────────────────────────────────

  describe("handlePostSignIn — no anon work, no existing projects", () => {
    beforeEach(() => {
      mockGetAnonWorkData.mockReturnValue(null);
      mockGetProjects.mockResolvedValue([]);
      mockSignInAction.mockResolvedValue({ success: true });
      mockSignUpAction.mockResolvedValue({ success: true });
    });

    it("creates a new project when user has no existing projects", async () => {
      mockCreateProject.mockResolvedValue(makeProject("new-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockCreateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [],
          data: {},
        })
      );
    });

    it("redirects to the newly created project", async () => {
      mockCreateProject.mockResolvedValue(makeProject("brand-new"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/brand-new");
    });

    it("gives the new project a non-empty name", async () => {
      mockCreateProject.mockResolvedValue(makeProject("brand-new"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("a@b.com", "pass");
      });

      const callArg = mockCreateProject.mock.calls[0][0];
      expect(callArg.name).toBeTruthy();
      expect(callArg.name.length).toBeGreaterThan(0);
    });

    it("works the same way after successful sign-up", async () => {
      mockCreateProject.mockResolvedValue(makeProject("signup-proj"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@b.com", "pass");
      });

      expect(mockPush).toHaveBeenCalledWith("/signup-proj");
    });
  });
});
