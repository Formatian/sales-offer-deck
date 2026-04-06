import { afterEach, describe, expect, it, vi } from "vitest";
import { getRegistrySpecsUrl } from "../src/config";
import { listRegistrySpecs, pullSkillMarkdown } from "../src/registry/registryClient";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("pullSkillMarkdown", () => {
  it("returns markdown on successful registry response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            paper: {
              slug: "paper",
              name: "Paper",
              skillPath: "skills/paper/SKILL.md"
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response("## hello", {
          status: 200,
          headers: {
            "content-type": "text/markdown; charset=utf-8"
          }
        })
      );
    global.fetch = fetchMock as typeof fetch;

    const result = await pullSkillMarkdown("paper");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.markdown).toContain("## hello");
    }
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      getRegistrySpecsUrl(),
      expect.objectContaining({
        method: "GET"
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "https://raw.githubusercontent.com/bergside/awesome-design-skills/main/skills/paper/SKILL.md",
      expect.objectContaining({
        method: "GET"
      })
    );
  });

  it("accepts text/plain markdown responses from raw GitHub", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            paper: {
              slug: "paper",
              name: "Paper",
              skillPath: "skills/paper/SKILL.md"
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(
        new Response("## hello", {
          status: 200,
          headers: {
            "content-type": "text/plain; charset=utf-8"
          }
        })
      );
    global.fetch = fetchMock as typeof fetch;

    const result = await pullSkillMarkdown("paper");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.markdown).toContain("## hello");
    }
  });

  it("returns not_found when slug does not exist in index", async () => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          paper: {
            slug: "paper",
            name: "Paper",
            skillPath: "skills/paper/SKILL.md"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }) as typeof fetch;

    const result = await pullSkillMarkdown("missing");
    expect(result).toEqual({
      ok: false,
      reason: "not_found"
    });
  });

  it("maps not found when markdown file URL is missing", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            paper: {
              slug: "paper",
              name: "Paper",
              skillPath: "skills/paper/SKILL.md"
            }
          }),
          {
            status: 200,
            headers: {
              "content-type": "application/json"
            }
          }
        )
      )
      .mockResolvedValueOnce(new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain"
        }
      }));
    global.fetch = fetchMock as typeof fetch;

    const result = await pullSkillMarkdown("paper");
    expect(result).toEqual({
      ok: false,
      reason: "not_found"
    });
  });

  it("rejects invalid slug before network request", async () => {
    global.fetch = vi.fn() as typeof fetch;
    const result = await pullSkillMarkdown("Bad Slug");
    expect(result.ok).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe("listRegistrySpecs", () => {
  it("returns parsed specs for valid response", async () => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          paper: {
            slug: "paper",
            name: "Paper",
            skillPath: "skills/paper/SKILL.md"
          },
          simple: {
            slug: "simple",
            name: "Simple",
            skillPath: "skills/simple/SKILL.md"
          },
          noSkill: {
            slug: "no-skill",
            name: "No Skill",
            skillPath: ""
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }) as typeof fetch;

    const result = await listRegistrySpecs();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.specs).toHaveLength(3);
      expect(result.specs[0]).toEqual(
        expect.objectContaining({
          slug: "paper",
          hasSkillMd: true,
          previewUrl: "https://github.com/bergside/awesome-design-skills/tree/main/skills/paper"
        })
      );
      expect(result.specs[2]).toEqual(
        expect.objectContaining({
          slug: "no-skill",
          hasSkillMd: false
        })
      );
    }
  });

  it("returns invalid format for malformed index payload", async () => {
    global.fetch = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          paper: {
            slug: "paper",
            name: "Paper"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    }) as typeof fetch;

    const result = await listRegistrySpecs();
    expect(result).toEqual({
      ok: false,
      reason: "Registry index has an unexpected format."
    });
  });

  it("maps registry index fetch failures", async () => {
    global.fetch = vi.fn(async () => {
      return new Response("Unavailable", {
        status: 503,
        headers: {
          "content-type": "text/plain"
        }
      });
    }) as typeof fetch;

    const result = await listRegistrySpecs();
    expect(result).toEqual({
      ok: false,
      reason: "Unexpected registry response (503) while fetching registry index."
    });
  });

  it("uses GET against the index endpoint", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          paper: {
            slug: "paper",
            name: "Paper",
            skillPath: "skills/paper/SKILL.md"
          }
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json"
          }
        }
      );
    });
    global.fetch = fetchMock as typeof fetch;

    await listRegistrySpecs();
    expect(fetchMock).toHaveBeenCalledWith(
      getRegistrySpecsUrl(),
      expect.objectContaining({
        method: "GET"
      })
    );
  });
});
